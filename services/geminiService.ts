import { GoogleGenAI, Modality, Part } from "@google/genai";
import type { DesignOptions, ProductData, HouseMasks } from "../types";

// FIX: Initialize the GoogleGenAI client according to the guidelines.
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

/**
 * Converts a File object to a GoogleGenAI.Part object for multimodal input.
 * @param file The file to convert.
 * @returns A promise that resolves to a Part object.
 */
const fileToGenerativePart = async (file: File): Promise<Part> => {
  const base64EncodedData = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  return {
    inlineData: {
      mimeType: file.type,
      data: base64EncodedData,
    },
  };
};

/**
 * Converts a data URL string to a File object.
 * @param dataUrl The data URL to convert.
 * @param filename The desired filename for the new File object.
 * @returns A promise that resolves to a File object.
 */
const dataUrlToFile = async (dataUrl: string, filename: string): Promise<File> => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type });
};

/**
 * Retrieves an image from a URL or uses the provided File object and converts it to a Part.
 * @param productSource The source of the product image, either a URL string or a File object.
 * @returns A promise that resolves to a Part object.
 */
const getProductImagePart = async (productSource: File | string): Promise<Part> => {
    if (typeof productSource === 'string') {
        // Assuming it's a relative URL from products.json, need to fetch it.
        const file = await dataUrlToFile(productSource, 'product.jpg');
        return fileToGenerativePart(file);
    }
    return fileToGenerativePart(productSource);
};


/**
 * Generates a single segmentation mask for a specific part of a house using the Gemini API.
 * @param imageFile The original image of the house.
 * @param element The part of the house to generate a mask for (e.g., 'siding').
 * @returns A promise that resolves to the base64 encoded mask image data.
 */
export const generateSingleMask = async (imageFile: File, element: keyof HouseMasks): Promise<string> => {
    const imagePart = await fileToGenerativePart(imageFile);
    
    let prompt: string;
    
    if (element === 'siding') {
        prompt = `Create a binary mask for house wall siding.
CRITICAL: Output must maintain EXACT same dimensions and aspect ratio as input image. Do not crop or resize.
Output a pure black and white image where:
- WHITE (#FFFFFF): All wall siding surfaces including gables and dormers
- BLACK (#000000): Roof shingles, window/door trim frames, windows, doors, sky, ground

Include siding on all wall surfaces but avoid roof materials and trim boards.
The mask must be clean with sharp edges. No gray values.`;
    } else if (element === 'trim') {
        prompt = `Create a binary mask for house trim elements.
CRITICAL: Output must maintain EXACT same dimensions and aspect ratio as input image. Do not crop or resize.
Output a pure black and white image where:
- WHITE (#FFFFFF): All trim boards - window frames, door frames, corner boards, fascia boards (solid filled areas)
- BLACK (#000000): Siding walls, window glass, door panels, roof, sky, ground

Fill the entire width of trim boards, not just outlines.
The mask must be clean with sharp edges. No gray values.`;
    } else if (element === 'door') {
        prompt = `Create a binary mask for doors.
CRITICAL: Output must maintain EXACT same dimensions and aspect ratio as input image. Do not crop or resize.
Output a pure black and white image where:
- WHITE (#FFFFFF): Entry doors only (front doors, side doors) - exclude garage doors
- BLACK (#000000): Everything else (walls, windows, trim, roof, sky, ground, garage doors)

The mask must be clean with sharp edges. No gray values.`;
    } else if (element === 'roofing') {
        prompt = `Create a binary mask for roof shingles/tiles only.
CRITICAL: Output must maintain EXACT same dimensions and aspect ratio as input image. Do not crop or resize.
Output a pure black and white image where:
- WHITE (#FFFFFF): Only the roof surface material (shingles, tiles, metal panels)
- BLACK (#000000): Gutters, fascia boards, siding walls, dormers, windows, chimneys, vents, sky

Exclude all roof trim, gutters, fascia, and any vertical wall surfaces.
The mask must be clean with sharp edges. No gray values.`;
    } else {
        prompt = `Create a binary mask for ${element}.
CRITICAL: Output must maintain EXACT same dimensions and aspect ratio as input image. Do not crop or resize.
Output a pure black and white image where:
- WHITE (#FFFFFF): ${element} areas only
- BLACK (#000000): Everything else

The mask must be clean with sharp edges. No gray values.`;
    }

    // FIX: Use gemini-2.5-flash-image-preview model for image generation tasks.
    // FIX: Include both Modality.IMAGE and Modality.TEXT in responseModalities as per guidelines.
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
            parts: [
                imagePart,
                { text: prompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return part.inlineData.data;
        }
    }
    
    throw new Error(`Failed to generate mask for ${element}. No image was returned from the API.`);
};



/**
 * Generates masks for all specified parts of a house, reporting progress along the way.
 * @param imageFile The original house image.
 * @param progressCallback A function to call with progress updates.
 * @returns A promise that resolves to an object containing the base64 encoded mask for each house part.
 */
export const generateMasks = async (
    imageFile: File,
    progressCallback: (element: keyof HouseMasks, status: 'generating' | 'complete' | 'error', data?: string) => void
): Promise<HouseMasks> => {
    const elementsToMask: (keyof HouseMasks)[] = ['siding', 'roofing', 'trim', 'door'];
    const generatedMasks: HouseMasks = {};

    // FIX: Generate masks sequentially with a delay to avoid hitting API rate limits.
    // The previous parallel approach (`Promise.all`) was causing "RESOURCE_EXHAUSTED" errors.
    for (const [index, element] of elementsToMask.entries()) {
        try {
            progressCallback(element, 'generating');
            const maskData = await generateSingleMask(imageFile, element);
            generatedMasks[element] = maskData;
            progressCallback(element, 'complete', maskData);
        } catch (error) {
            console.error(`Error generating mask for ${element}:`, error);
            progressCallback(element, 'error');
            // Allow other mask generations to proceed even if one fails.
        }

        // Add a delay between API calls to robustly handle rate limits.
        if (index < elementsToMask.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1-second delay
        }
    }
    
    if (Object.keys(generatedMasks).length === 0) {
        throw new Error("AI analysis failed for all parts of the house. Please try a different image.");
    }

    return generatedMasks;
};

/**
 * Applies the selected design changes to the house image iteratively using the Gemini API.
 * @param originalImageFile The starting image of the house.
 * @param masks An object containing the segmentation masks for different house parts.
 * @param options The user-selected design choices.
 * @param selectedImageFiles An object mapping house parts to custom material image files or product image URLs.
 * an object mapping house parts to custom material image files or product image URLs.
 * @param progressCallback A function to report the generation progress.
 * @returns A promise that resolves to the base64 encoded string of the final generated image.
 */
export const applyChangesIteratively = async (
    originalImageFile: File,
    masks: HouseMasks,
    options: DesignOptions,
    selectedImageFiles: Partial<Record<keyof ProductData, File | string>>,
    progressCallback: (message: string, percentage: number) => void
): Promise<string> => {

    let currentImageFile: File = originalImageFile;
    // The order of application can affect the final result, e.g., apply siding before trim.
    const changesToApply: (keyof HouseMasks)[] = ['roofing', 'siding', 'trim', 'door']; 
    const totalSteps = changesToApply.filter(element => options[`${element}Product` as keyof DesignOptions] && masks[element]).length;
    let completedSteps = 0;
    
    for (const element of changesToApply) {
        const productKey = `${element}Product` as keyof DesignOptions;
        const colorKey = `${element}Color` as keyof DesignOptions;

        const productName = options[productKey];
        const maskData = masks[element];

        // Skip if no product is selected for this element or if the mask is missing.
        if (!productName || !maskData) {
            continue;
        }
        
        completedSteps++;
        progressCallback(`Applying new ${element}...`, (completedSteps / totalSteps) * 100);

        const currentImagePart = await fileToGenerativePart(currentImageFile);
        const maskPart: Part = {
            inlineData: {
                mimeType: 'image/png',
                data: maskData,
            },
        };
        
        let promptText: string;
        const parts: Part[] = [currentImagePart, maskPart];
        
        const materialSource = selectedImageFiles[element];
        if (materialSource && typeof materialSource !== 'undefined') {
            // A custom texture/material image is provided.
            const materialPart = await getProductImagePart(materialSource);
            parts.push(materialPart);
            promptText = `Apply the texture from the third image to the white areas of the mask (second image) on the house (first image). 
CRITICAL: Preserve the EXACT original image dimensions and aspect ratio. Do not crop, resize, or alter the image boundaries. 
Keep the exact same image dimensions, lighting and shadows realistic. The color should be ${options[colorKey]}.
Output only the modified house image with identical dimensions and full image content.`;
        } else {
            // No material image, just apply a color change based on the product name.
            promptText = `Change the white areas in the mask to ${options[colorKey]} color in the house image.
The style is "${productName}". CRITICAL: Preserve the EXACT original image dimensions and aspect ratio. Do not crop, resize, or alter the image boundaries.
Keep the exact same image dimensions, lighting and shadows realistic.
Output only the modified house image with identical dimensions and full image content.`;
        }
        
        parts.push({ text: promptText });

        // FIX: Use gemini-2.5-flash-image-preview model for image editing tasks.
        // FIX: Include both Modality.IMAGE and Modality.TEXT in responseModalities as per guidelines.
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        let foundImage = false;
        // The API may return multiple parts, find the image part.
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const newImageDataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                // The output of this step becomes the input for the next.
                currentImageFile = await dataUrlToFile(newImageDataUrl, `step_${completedSteps}.png`);
                foundImage = true;
                break;
            }
        }

        if (!foundImage) {
             throw new Error(`AI failed to apply changes for ${element}. No image was returned.`);
        }
    }

    // Convert the final resulting file back to a base64 string for the UI.
    const finalBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(currentImageFile);
    });

    return finalBase64;
};