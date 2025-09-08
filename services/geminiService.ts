
import { GoogleGenAI, Modality, Part } from "@google/genai";
import type { DesignOptions, ProductData, HouseMasks } from "../types";

// FIX: Initialize the GoogleGenAI client according to the guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

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
    
    const prompt = `From the provided image of a house, generate a precise, binary segmentation mask for the ${element}. 
The mask must be entirely black and white. 
- The area corresponding to the ${element} should be pure white (#FFFFFF).
- All other areas, including the background, sky, trees, and other parts of the house, must be pure black (#000000).
Do not include any other colors, shades of gray, or anti-aliasing. The output must be only the mask image. Do not output any text.`;

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
 * Generates a precise 2px red line trace around the perimeter of the house's siding.
 * @param imageFile The original image of the house.
 * @returns A promise that resolves to the base64 encoded trace image data.
 */
export const generateSidingTrace = async (imageFile: File): Promise<string> => {
    const imagePart = await fileToGenerativePart(imageFile);
    
    const prompt = `From the provided image of a house, act as a precise edge-detection tool. Your task is to draw a 2-pixel thick, solid red (#FF0000) line that perfectly outlines the perimeter of all the 'siding'.
- 'Siding' is the main exterior wall covering.
- If there are multiple distinct styles or sections of siding (e.g., horizontal panels on one level, shake shingles on another), draw a separate, closed-loop outline around each individual section.
- Crucially, you must EXCLUDE all other elements. Do NOT draw lines around windows, doors, trim, the roof, gutters, or shutters. The line should terminate exactly where the siding meets these other elements.
- Do NOT fill any areas. Only draw the outlines.
- The output must be ONLY the red lines on a completely transparent background.
- The final image must have the exact same dimensions as the original input image. Do not output any text.`;

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
    
    throw new Error(`Failed to generate trace for siding. No image was returned from the API.`);
};

/**
 * Generates a precise 2px red line trace around the perimeter of the house's trim.
 * @param imageFile The original image of the house.
 * @returns A promise that resolves to the base64 encoded trace image data.
 */
export const generateTrimTrace = async (imageFile: File): Promise<string> => {
    const imagePart = await fileToGenerativePart(imageFile);
    
    const prompt = `From the provided image of a house, act as a precise edge-detection tool. Your task is to draw a 2-pixel thick, solid red (#FF0000) line that perfectly outlines the perimeter of all the 'trim'.
- 'Trim' includes the boards framing the windows, the boards framing the doors, the corner boards of the house, and any fascia boards along the roofline.
- Do NOT fill the area. Only draw the outline.
- The output must be ONLY the red line on a completely transparent background.
- The final image must have the exact same dimensions as the original input image. Do not output any text.`;

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
    
    throw new Error(`Failed to generate trace for trim. No image was returned from the API.`);
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
            let maskData;
            if (element === 'siding') {
                maskData = await generateSidingTrace(imageFile);
            } else if (element === 'trim') {
                maskData = await generateTrimTrace(imageFile);
            } else {
                maskData = await generateSingleMask(imageFile, element);
            }
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
            promptText = `Using the primary image of the house, the provided black and white mask, and the material texture image, replace the area of the house indicated by the white portion of the mask with the new material. Maintain the original image's lighting, shadows, and perspective to ensure a photorealistic result. The new ${element} should blend seamlessly. The specified color is ${options[colorKey]}.`;
        } else {
            // No material image, just apply a color change based on the product name.
            promptText = `Using the primary image of the house and the provided black and white mask, change the color of the area indicated by the white portion of the mask to ${options[colorKey]}. The product style is "${productName}". Maintain the original image's texture, lighting, shadows, and perspective to ensure a photorealistic result. The new ${element} color should blend seamlessly.`;
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
