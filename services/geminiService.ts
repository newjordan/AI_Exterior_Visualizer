import { GoogleGenAI, Modality, type GenerateContentResponse, type Part } from '@google/genai';
import { GEMINI_IMAGE_MODEL } from '../constants';
import type { DesignOptions, HouseMasks, ProductData } from '../types';
import { getApiKey } from './apiKey';
import { isAbortError } from './errors';

const MASK_ELEMENTS: (keyof HouseMasks)[] = ['siding', 'roofing', 'trim', 'door'];

function requireClient(): GoogleGenAI {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Add a Gemini API key to analyze or visualize a home. Preview mode can still browse materials.');
  }
  return new GoogleGenAI({ apiKey });
}

const fileToGenerativePart = async (file: File): Promise<Part> => {
  const base64EncodedData = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Could not read the image file.'));
        return;
      }
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the image file.'));
    reader.readAsDataURL(file);
  });

  if (!base64EncodedData) {
    throw new Error('The image file was empty.');
  }

  return {
    inlineData: {
      mimeType: file.type || 'image/jpeg',
      data: base64EncodedData,
    },
  };
};

const sourceToFile = async (source: File | string, filename: string): Promise<File> => {
  if (source instanceof File) return source;
  // Imgur rejects hotlinked catalog photos when a Referer is present.
  const response = await fetch(source, { referrerPolicy: 'no-referrer' });
  if (!response.ok) {
    throw new Error(`Could not load the material image (${response.status}).`);
  }
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type || 'image/jpeg' });
};

const dataUrlToFile = async (dataUrl: string, filename: string): Promise<File> => {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type || 'image/png' });
};

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new DOMException('The request was cancelled.', 'AbortError');
  }
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException('The request was cancelled.', 'AbortError'));
    };
    if (signal?.aborted) {
      onAbort();
      return;
    }
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * Prefer the last non-thought image. Thinking image models can emit interim
 * images before the finished edit, and concatenating them would corrupt the file.
 */
function extractImage(response: GenerateContentResponse): { data: string; mimeType: string } | null {
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  let found: { data: string; mimeType: string } | null = null;
  for (const part of parts) {
    if (part.thought || !part.inlineData?.data) continue;
    found = {
      data: part.inlineData.data,
      mimeType: part.inlineData.mimeType || 'image/png',
    };
  }
  return found;
}

function describeMissingImage(response: GenerateContentResponse, subject: string): string {
  const block = response.promptFeedback?.blockReason;
  if (block) {
    return `Gemini blocked the ${subject} request (${String(block)}). Try a different photo.`;
  }
  const finish = response.candidates?.[0]?.finishReason;
  if (finish && String(finish) !== 'STOP') {
    return `Gemini did not return an image for ${subject} (${String(finish)}).`;
  }
  return `Gemini did not return an image for ${subject}.`;
}

function maskPrompt(element: keyof HouseMasks): string {
  if (element === 'siding') {
    return `Create a binary mask for house wall siding.
CRITICAL: Output must maintain EXACT same dimensions and aspect ratio as input image. Do not crop or resize.
Output a pure black and white image where:
- WHITE (#FFFFFF): All wall siding surfaces including gables and dormers
- BLACK (#000000): Roof shingles, window/door trim frames, windows, doors, sky, ground

Include siding on all wall surfaces but avoid roof materials and trim boards.
The mask must be clean with sharp edges. No gray values.`;
  }
  if (element === 'trim') {
    return `Create a binary mask for house trim elements.
CRITICAL: Output must maintain EXACT same dimensions and aspect ratio as input image. Do not crop or resize.
Output a pure black and white image where:
- WHITE (#FFFFFF): All trim boards - window frames, door frames, corner boards, fascia boards (solid filled areas)
- BLACK (#000000): Siding walls, window glass, door panels, roof, sky, ground

Fill the entire width of trim boards, not just outlines.
The mask must be clean with sharp edges. No gray values.`;
  }
  if (element === 'door') {
    return `Create a binary mask for doors.
CRITICAL: Output must maintain EXACT same dimensions and aspect ratio as input image. Do not crop or resize.
Output a pure black and white image where:
- WHITE (#FFFFFF): Entry doors only (front doors, side doors) - exclude garage doors
- BLACK (#000000): Everything else (walls, windows, trim, roof, sky, ground, garage doors)

The mask must be clean with sharp edges. No gray values.`;
  }
  if (element === 'roofing') {
    return `Create a binary mask for roof shingles/tiles only.
CRITICAL: Output must maintain EXACT same dimensions and aspect ratio as input image. Do not crop or resize.
Output a pure black and white image where:
- WHITE (#FFFFFF): Only the roof surface material (shingles, tiles, metal panels)
- BLACK (#000000): Gutters, fascia boards, siding walls, dormers, windows, chimneys, vents, sky

Exclude all roof trim, gutters, fascia, and any vertical wall surfaces.
The mask must be clean with sharp edges. No gray values.`;
  }
  return `Create a binary mask for ${element}.
CRITICAL: Output must maintain EXACT same dimensions and aspect ratio as input image. Do not crop or resize.
Output a pure black and white image where:
- WHITE (#FFFFFF): ${element} areas only
- BLACK (#000000): Everything else

The mask must be clean with sharp edges. No gray values.`;
}

export const generateSingleMask = async (
  imageFile: File,
  element: keyof HouseMasks,
  signal?: AbortSignal,
): Promise<string> => {
  throwIfAborted(signal);
  const ai = requireClient();
  const imagePart = await fileToGenerativePart(imageFile);
  throwIfAborted(signal);

  const response = await ai.models.generateContent({
    model: GEMINI_IMAGE_MODEL,
    contents: {
      parts: [imagePart, { text: maskPrompt(element) }],
    },
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
      abortSignal: signal,
    },
  });

  const image = extractImage(response);
  if (!image) {
    throw new Error(describeMissingImage(response, `${element} mask`));
  }
  return image.data;
};

export const generateMasks = async (
  imageFile: File,
  progressCallback: (element: keyof HouseMasks, status: 'generating' | 'complete' | 'error', data?: string) => void,
  signal?: AbortSignal,
): Promise<HouseMasks> => {
  const generatedMasks: HouseMasks = {};

  for (const [index, element] of MASK_ELEMENTS.entries()) {
    throwIfAborted(signal);
    try {
      progressCallback(element, 'generating');
      const maskData = await generateSingleMask(imageFile, element, signal);
      generatedMasks[element] = maskData;
      progressCallback(element, 'complete', maskData);
    } catch (error) {
      if (isAbortError(error)) throw error;
      console.error(`Error generating mask for ${element}:`, error);
      progressCallback(element, 'error');
    }

    if (index < MASK_ELEMENTS.length - 1) {
      await delay(1000, signal);
    }
  }

  if (Object.keys(generatedMasks).length === 0) {
    throw new Error('AI analysis failed for every part of the house. Try a clearer exterior photo.');
  }

  return generatedMasks;
};

export const applyChangesIteratively = async (
  originalImageFile: File,
  masks: HouseMasks,
  options: DesignOptions,
  selectedImageFiles: Partial<Record<keyof ProductData, File | string>>,
  progressCallback: (message: string, percentage: number) => void,
  signal?: AbortSignal,
): Promise<string> => {
  const ai = requireClient();
  let currentImageFile: File = originalImageFile;
  const changesToApply: (keyof HouseMasks)[] = ['roofing', 'siding', 'trim', 'door'];
  const totalSteps = changesToApply.filter((element) => options[`${element}Product`] && masks[element]).length;
  let completedSteps = 0;

  if (totalSteps === 0) {
    throw new Error('Analyze the photo before visualizing. The model needs masks for the areas you want to change.');
  }

  for (const element of changesToApply) {
    throwIfAborted(signal);
    const productName = options[`${element}Product`];
    const maskData = masks[element];
    if (!productName || !maskData) continue;

    completedSteps += 1;
    progressCallback(`Applying new ${element}...`, (completedSteps / totalSteps) * 100);

    const currentImagePart = await fileToGenerativePart(currentImageFile);
    const maskPart: Part = {
      inlineData: {
        mimeType: 'image/png',
        data: maskData,
      },
    };

    const parts: Part[] = [currentImagePart, maskPart];
    let promptText: string;
    const materialSource = selectedImageFiles[element];

    if (materialSource) {
      try {
        const materialFile = await sourceToFile(materialSource, `${element}-material.jpg`);
        parts.push(await fileToGenerativePart(materialFile));
        promptText = `Apply the texture from the third image to the white areas of the mask (second image) on the house (first image).
CRITICAL: Preserve the EXACT original image dimensions and aspect ratio. Do not crop, resize, or alter the image boundaries.
Keep the exact same image dimensions, lighting and shadows realistic. The color should be ${options[`${element}Color`]}.
Output only the modified house image with identical dimensions and full image content.`;
      } catch (error) {
        console.warn(`Material image for ${element} could not be loaded. Falling back to a color change.`, error);
        promptText = `Change the white areas in the mask to ${options[`${element}Color`]} color in the house image.
The style is "${productName}". CRITICAL: Preserve the EXACT original image dimensions and aspect ratio. Do not crop, resize, or alter the image boundaries.
Keep the exact same image dimensions, lighting and shadows realistic.
Output only the modified house image with identical dimensions and full image content.`;
      }
    } else {
      promptText = `Change the white areas in the mask to ${options[`${element}Color`]} color in the house image.
The style is "${productName}". CRITICAL: Preserve the EXACT original image dimensions and aspect ratio. Do not crop, resize, or alter the image boundaries.
Keep the exact same image dimensions, lighting and shadows realistic.
Output only the modified house image with identical dimensions and full image content.`;
    }

    parts.push({ text: promptText });
    throwIfAborted(signal);

    const response = await ai.models.generateContent({
      model: GEMINI_IMAGE_MODEL,
      contents: { parts },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
        abortSignal: signal,
      },
    });

    const image = extractImage(response);
    if (!image) {
      throw new Error(describeMissingImage(response, element));
    }

    const newImageDataUrl = `data:${image.mimeType};base64,${image.data}`;
    currentImageFile = await dataUrlToFile(newImageDataUrl, `step_${completedSteps}.png`);
  }

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Could not read the finished visualization.'));
        return;
      }
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the finished visualization.'));
    reader.readAsDataURL(currentImageFile);
  });
};
