/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

// Helper function to convert a File object to a Gemini API Part
const fileToPart = async (file: File): Promise<{ inlineData: { mimeType: string; data: string; } }> => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
    
    const arr = dataUrl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");
    
    const mimeType = mimeMatch[1];
    const data = arr[1];
    return { inlineData: { mimeType, data } };
};

const handleApiResponse = (
    response: GenerateContentResponse,
    context: string // e.g., "edit", "filter", "adjustment"
): string => {
    // 1. Check for prompt blocking first
    if (response.promptFeedback?.blockReason) {
        const { blockReason, blockReasonMessage } = response.promptFeedback;
        const errorMessage = `Request was blocked. Reason: ${blockReason}. ${blockReasonMessage || ''}`;
        console.error(errorMessage, { response });
        throw new Error(errorMessage);
    }

    // 2. Try to find the image part
    const imagePartFromResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (imagePartFromResponse?.inlineData) {
        const { mimeType, data } = imagePartFromResponse.inlineData;
        console.log(`Received image data (${mimeType}) for ${context}`);
        return `data:${mimeType};base64,${data}`;
    }

    // 3. If no image, check for other reasons
    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
        const errorMessage = `Image generation for ${context} stopped unexpectedly. Reason: ${finishReason}. This often relates to safety settings.`;
        console.error(errorMessage, { response });
        throw new Error(errorMessage);
    }
    
    const textFeedback = response.text?.trim();
    const errorMessage = `The AI model did not return an image for the ${context}. ` + 
        (textFeedback 
            ? `The model responded with text: "${textFeedback}"`
            : "This can happen due to safety filters or if the request is too complex. Please try rephrasing your prompt to be more direct.");

    console.error(`Model response did not contain an image part for ${context}.`, { response });
    throw new Error(errorMessage);
};

/**
 * Generates an image with a global adjustment applied using generative AI.
 * @param originalImage The original image file.
 * @param adjustmentPrompt The text prompt describing the desired adjustment.
 * @returns A promise that resolves to the data URL of the adjusted image.
 */
export const generateAdjustedImage = async (
    originalImage: File,
    adjustmentPrompt: string,
): Promise<string> => {
    console.log(`Starting global adjustment generation: ${adjustmentPrompt}`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are an expert photo editor AI. Your task is to perform a natural, global adjustment to the entire image based on the user's request.
User Request: "${adjustmentPrompt}"

Editing Guidelines:
- The adjustment must be applied across the entire image.
- The result must be photorealistic.

Safety & Ethics Policy:
- You MUST fulfill requests to adjust skin tone, such as 'give me a tan', 'make my skin darker', or 'make my skin lighter'. These are considered standard photo enhancements.
- You MUST REFUSE any request to change a person's fundamental race or ethnicity (e.g., 'make me look Asian', 'change this person to be Black'). Do not perform these edits. If the request is ambiguous, err on the of caution and do not change racial characteristics.

Output: Return ONLY the final adjusted image. Do not return text.`;
    const textPart = { text: prompt };

    console.log('Sending image and adjustment prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
    });
    console.log('Received response from model for adjustment.', response);
    
    return handleApiResponse(response, 'adjustment');
};

/**
 * Analyzes an image and suggests text content to overlay on it.
 * @param imageFile The image to analyze.
 * @returns A promise that resolves to an array of 3 text suggestions.
 */
export const suggestTextForImage = async (imageFile: File): Promise<string[]> => {
    console.log('Requesting text suggestions for image...');
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const imagePart = await fileToPart(imageFile);
    
    const prompt = `Analyze this image and its mood. Suggest exactly 3 short, creative text overlays. These could be captions, quotes, or evocative phrases. The text should be suitable for placing directly onto the image.

    Guidelines:
    - Keep each suggestion concise (2-5 words).
    - Match the tone of the image (e.g., adventurous, peaceful, elegant).
    - Provide variety in the suggestions.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    suggestions: {
                        type: Type.ARRAY,
                        description: 'An array of 3 text overlay suggestions.',
                        items: { type: Type.STRING }
                    }
                },
                required: ['suggestions'],
            }
        }
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    if (!result.suggestions) {
        throw new Error('AI did not return suggestions in the expected format.');
    }
    console.log('Received text suggestions:', result.suggestions);
    return result.suggestions;
};

/**
 * Analyzes a product image and suggests lifestyle scene ideas.
 */
export const analyzeProductForLifestyleIdeas = async (
    productImage: File,
    productInfo: string
): Promise<{ description: string; ideas: string[] }> => {
    console.log('Requesting lifestyle ideas for product...');
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const imagePart = await fileToPart(productImage);
    const prompt = `You are a creative director for an advertising agency. Analyze the product in this image. Use the additional user-provided information if available.
First, provide a short, single-sentence description of the product.
Then, suggest exactly 3 distinct and creative lifestyle scenes where this product would fit naturally. The scenes should be photographic concepts.

User-provided info: "${productInfo || 'None'}"`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    description: {
                        type: Type.STRING,
                        description: 'A short, single-sentence description of the product in the image.',
                    },
                    ideas: {
                        type: Type.ARRAY,
                        description: 'An array of 3 creative lifestyle scene concepts for the product.',
                        items: { type: Type.STRING }
                    }
                },
                required: ['description', 'ideas'],
            }
        }
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    if (!result.description || !result.ideas) {
        throw new Error('AI did not return ideas in the expected format.');
    }
    console.log('Received lifestyle ideas:', result);
    return result;
};

/**
 * Creates a detailed image generation prompt from a creative idea.
 */
export const createImagePromptFromIdea = async (
    productDescription: string,
    idea: string
): Promise<string> => {
    console.log(`Creating detailed prompt for idea: ${idea}`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const prompt = `You are a world-class prompt engineer specializing in generative AI for photography. Your task is to expand a simple idea into a detailed, photorealistic image generation prompt. The prompt should be suitable for a model that can place a specific product into a new scene.

Product Description: "${productDescription}"
Scene Idea: "${idea}"

Instructions: Create a detailed paragraph describing the scene. Include details about the environment, lighting, atmosphere, composition, and camera settings (e.g., 'shot on a 50mm lens, f/1.8, golden hour lighting'). The prompt should ONLY describe the background scene and context. DO NOT mention the product itself. The final output must be just the text of the prompt.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });

    const detailedPrompt = response.text.trim();
    console.log('Generated detailed prompt:', detailedPrompt);
    return detailedPrompt;
};

/**
 * Generates a new lifestyle image by placing the product in a new scene.
 */
export const generateLifestyleImage = async (
    originalImage: File,
    detailedPrompt: string
): Promise<string> => {
    console.log(`Starting lifestyle image generation...`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are an expert photo compositor AI. Your task is to take the main product from the provided image and place it seamlessly into a new scene described by the following prompt. The product should look like it naturally belongs in the new environment, with correct lighting, shadows, and perspective.

Scene Prompt: "${detailedPrompt}"

Instructions:
1. Identify the primary product in the image (e.g., the wallet, the bottle).
2. Perfectly isolate the product.
3. Generate the new background scene based on the prompt.
4. Place the isolated product into the generated scene, ensuring it is perfectly blended.

Output: Return ONLY the final composited image. Do not return text.`;
    const textPart = { text: prompt };

    console.log('Sending product image and scene prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
    });
    console.log('Received response from model for lifestyle image.', response);

    return handleApiResponse(response, 'lifestyle image');
};