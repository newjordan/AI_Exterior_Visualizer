import { GoogleGenAI, Modality } from "@google/genai";
import type { DesignOptions, HouseMasks } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

const base64ToGenerativePart = (base64Data: string, mimeType: string) => {
    return {
        inlineData: { data: base64Data, mimeType },
    };
};

export const generateMasks = async (
    imageFile: File,
    onProgress: (element: keyof HouseMasks, status: 'generating' | 'complete' | 'error', data?: string) => void
): Promise<HouseMasks> => {
    const imagePart = await fileToGenerativePart(imageFile);
    const elementsToMask: (keyof HouseMasks)[] = ['siding', 'roofing', 'trim', 'door'];
    const allMasks: HouseMasks = {};

    for (const element of elementsToMask) {
        try {
            onProgress(element, 'generating');
            const prompt = `Your task is image segmentation. Look at the image of the house and isolate the ${element} only.
Create a new image where the ${element} is preserved perfectly, and everything else is pure black (#000000).
The output image must have the exact same dimensions as the original.
Return ONLY the final, edited image. Do not include any text, descriptions, or commentary in your response.`;

            const result = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: { parts: [imagePart, { text: prompt }] },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            });

            let maskData: string | undefined;
            for (const part of result.candidates[0].content.parts) {
                if (part.inlineData) {
                    maskData = part.inlineData.data;
                    break;
                }
            }

            if (!maskData) {
                 throw new Error(`AI did not return an image mask for ${element}.`);
            }
            
            allMasks[element] = maskData;
            onProgress(element, 'complete', maskData);
        } catch (error) {
            console.error(`Failed to generate mask for ${element}:`, error);
            onProgress(element, 'error');
            // Continue to the next element instead of stopping
        }
    }
    
    if (Object.keys(allMasks).length === 0) {
        throw new Error("AI analysis failed. It could not identify any elements of the house. Please try a different, clearer image.");
    }

    return allMasks;
};

const applySingleChange = async (
    baseImagePart: { inlineData: { data: string, mimeType: string } },
    maskPart: { inlineData: { data: string, mimeType: string } },
    prompt: string
): Promise<string> => {
    const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
            parts: [
                baseImagePart,
                maskPart,
                { text: prompt },
                { text: "Preserve all details of the original image that are outside the masked area (the black parts of the mask image). The result must be photorealistic. Return ONLY the final, edited image." }
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of result.candidates[0].content.parts) {
        if (part.inlineData) {
            return part.inlineData.data;
        }
    }
    throw new Error("AI did not return an image for a style change step.");
};

export const applyChangesIteratively = async (
  initialImageFile: File,
  masks: HouseMasks,
  options: DesignOptions,
  onProgress: (message: string, percentage: number) => void
): Promise<string> => {
    let currentImageBase64 = (await fileToGenerativePart(initialImageFile)).inlineData.data;
    const initialMimeType = initialImageFile.type;

    const changesToApply = [
        { element: 'siding', mask: masks.siding, prompt: `Using the provided mask which highlights the siding area, change the siding to ${options.sidingColor} ${options.sidingProduct}.` },
        { element: 'roofing', mask: masks.roofing, prompt: `Using the provided mask which highlights the roofing area, change the roofing to ${options.roofingColor} ${options.roofingProduct}.` },
        { element: 'trim', mask: masks.trim, prompt: `Using the provided mask which highlights the trim area, change the trim to ${options.trimColor} ${options.trimProduct}.` },
        { element: 'door', mask: masks.door, prompt: `Using the provided mask which highlights the front door, change the door to ${options.doorColor} ${options.doorProduct}.` }
    ].filter(change => change.mask);

    if (changesToApply.length === 0) {
        throw new Error("No changes to apply. Masks might be missing.");
    }

    let step = 0;
    const totalSteps = changesToApply.length;

    for (const change of changesToApply) {
        step++;
        onProgress(`Applying ${change.element} style...`, Math.round((step / totalSteps) * 100));

        const currentImagePart = base64ToGenerativePart(currentImageBase64, initialMimeType);
        const maskPart = base64ToGenerativePart(change.mask!, 'image/png');

        currentImageBase64 = await applySingleChange(currentImagePart, maskPart, change.prompt);
    }
    
    return currentImageBase64;
};
