import { GoogleGenAI, Modality } from "@google/genai";
import type { DesignOptions, ProductImageUrls } from '../types';

/**
 * Fetches an image, converts it to base64, and provides specific, user-friendly
 * error messages for different failure scenarios like network issues, broken links,
 * or corrupted data.
 */
const fetchAndConvertImage = async (url: string, productType: string): Promise<{ base64: string; mimeType: string }> => {
    let response: Response;
    try {
        // Attempt to fetch the image resource from the provided URL.
        response = await fetch(url);
    } catch (error) {
        // This error typically indicates a network failure or a Cross-Origin (CORS) issue.
        console.error(`Network error fetching image for ${productType} from ${url}:`, error);
        throw new Error(`Could not load the product image for '${productType}'. Please check your network connection.`);
    }

    if (!response.ok) {
        // This handles HTTP-level errors, such as a 404 Not Found or 500 Internal Server Error.
        console.error(`HTTP error for ${productType} image from ${url}: status ${response.status}`);
        throw new Error(`Could not load the product image for '${productType}'. The image link appears to be broken. Please try a different product.`);
    }

    try {
        // Process the successful response.
        const blob = await response.blob();
        if (!blob.type.startsWith('image/')) {
            // Validate that the fetched content is actually an image.
            throw new Error(`The file for '${productType}' is not a valid image.`);
        }

        // Convert the image data to a base64 string for the API.
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                const result = reader.result as string;
                const base64 = result.split(',')[1];
                if (base64) {
                    resolve({ base64, mimeType: blob.type });
                } else {
                    reject(new Error('Failed to read image data.'));
                }
            };
            reader.onerror = (error) => reject(error);
        });
    } catch (error) {
        // This catches errors during the data conversion process (e.g., blob creation, reading).
        console.error(`Error processing image data for ${productType} from ${url}:`, error);
        throw new Error(`The product image for '${productType}' could not be processed. It might be corrupted.`);
    }
};


export const visualizeExteriorDesign = async (
  base64ImageData: string,
  mimeType: string,
  options: DesignOptions,
  imageUrls: ProductImageUrls
): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const productTasks = [
        {
            key: 'Siding',
            url: imageUrls.sidingImageUrl,
            instruction: `Change all siding to **${options.sidingProduct}** in the color **${options.sidingColor}**.`,
            refText: "Use the provided siding reference image for an accurate representation of its style, texture, and material finish."
        },
        {
            key: 'Trim',
            url: imageUrls.trimImageUrl,
            instruction: `Change all trim (including window frames, fascia, and corner boards) to **${options.trimProduct}** in the color **${options.trimColor}**.`,
            refText: "Use the trim reference image to match its material and style."
        },
        {
            key: 'Front Door',
            url: imageUrls.doorImageUrl,
            instruction: `Change the main front door to a **${options.doorProduct}** style in the color **${options.doorColor}**.`,
            refText: "Use the door reference image to accurately model the new door's design and features."
        },
        {
            key: 'Roofing',
            url: imageUrls.roofingImageUrl,
            instruction: `Change the roof to **${options.roofingProduct}** in the color **${options.roofingColor}**.`,
            refText: "Use the roofing reference image for an accurate depiction of the shingle pattern, texture, and color blend."
        }
    ];

    const imageFetchPromises = productTasks.map(task => fetchAndConvertImage(task.url, task.key));
    const results = await Promise.allSettled(imageFetchPromises);

    const promptInstructions: string[] = [];
    const apiImageParts: ({ text: string } | { inlineData: { data: string; mimeType: string; } })[] = [];
    
    let successfulFetches = 0;
    results.forEach((result, index) => {
        const task = productTasks[index];
        let instruction = task.instruction;

        if (result.status === 'fulfilled') {
            successfulFetches++;
            instruction += ` ${task.refText}`;
            apiImageParts.push({ text: `Reference image for ${task.key.toLowerCase()} style and texture:` });
            apiImageParts.push({ inlineData: { data: result.value.base64, mimeType: result.value.mimeType } });
        } else {
            console.warn(`Could not fetch reference image for ${task.key}. Proceeding without it. Error:`, result.reason.message);
        }
        promptInstructions.push(instruction);
    });

    // If all image fetches failed, we cannot proceed meaningfully.
    if (successfulFetches === 0 && productTasks.length > 0) {
        throw new Error("Could not load any product reference images. Please check your network connection or try different products.");
    }

    const prompt = `You are an expert exterior design visualization AI. Your task is to apply specific, real-world products and colors to a user-provided image of a home. For some products, you will be given a reference image to guide the style and texture.

Based on the uploaded image of the home, perform the following modifications:
${promptInstructions.map((inst, i) => `${i + 1}. **${productTasks[i].key}:** ${inst.replace(`**${productTasks[i].key}:** `, '')}`).join('\n')}

The final output must be a single, photorealistic image. Seamlessly integrate the requested changes while perfectly maintaining the original image's lighting, shadows, perspective, and architectural details. Do not add, remove, or alter any other elements like landscaping or windows. Do not add any text, watermarks, or logos to the image. Output only the modified image.`;
    
    // Call the Gemini API with the multi-modal prompt.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { data: base64ImageData, mimeType: mimeType } },
          ...apiImageParts,
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    // Process the API response to extract the generated image.
    const imagePart = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);

    if (imagePart && imagePart.inlineData) {
      return imagePart.inlineData.data;
    } else {
      // If no image is returned, the API likely refused the request.
      const textPart = response.candidates?.[0]?.content?.parts.find(part => part.text);
      const refusalMessage = textPart?.text || "The AI could not process this image. It might be due to safety policies or image quality. Please try a different image.";
      throw new Error(refusalMessage);
    }
  } catch (error) {
    console.error("Gemini API call or image fetch failed:", error);
    if (error instanceof Error) {
        // Re-throw the specific, user-friendly error from fetchAndConvertImage
        // or the refusal message from the API so it can be displayed to the user.
        throw error; 
    }
    // Provide a fallback for any other unexpected errors.
    throw new Error("Failed to communicate with the visualization AI. Please check your network and try again.");
  }
};