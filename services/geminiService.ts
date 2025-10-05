import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Detects the dominant color of the main object in an image using the Gemini API.
 * @param base64Image The base64 encoded image string (without the data: prefix).
 * @returns A promise that resolves to the detected color name as a string.
 */
export const detectColorFromImage = async (base64Image: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: "You are an expert color identification AI. Your task is to analyze an image and identify the single most prominent color of the main object in the foreground. Respond with ONLY the name of the color. Do not add any punctuation, explanation, descriptive sentences, or any other words. For example, if the color is blue, your entire response must be 'Blue'. Your final output must be a single word.",
      },
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image,
            },
          },
          {
            text: "Identify the primary color of the main subject in this image.",
          },
        ],
      },
    });

    const colorText = response.text.trim();
    // Simple sanitization to remove potential punctuation, although the prompt should prevent it.
    return colorText.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
    
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to get response from AI model.");
  }
};