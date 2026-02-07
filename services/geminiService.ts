import { GoogleGenAI } from "@google/genai";
import { EditResponse } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

/**
 * Sends an image and a prompt to Gemini 2.5 Flash Image for editing.
 */
export const editImageWithGemini = async (
  imageBase64: string,
  mimeType: string,
  prompt: string
): Promise<EditResponse> => {
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  try {
    // According to guidelines: 'gemini-2.5-flash-image' is the model for Nano Banana / Flash Image
    const model = 'gemini-2.5-flash-image';

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              data: imageBase64,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      // No responseMimeType supported for nano banana models per guidelines
    });

    let generatedImageUrl: string | null = null;
    let generatedText: string | null = null;

    // Iterate through parts to find image and text
    const parts = response.candidates?.[0]?.content?.parts;

    if (parts) {
      for (const part of parts) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          // Construct a displayable data URL
          // Note: The model might return a specific mime type, usually image/jpeg or image/png
          // We can try to infer or default to image/png if not provided in part.inlineData.mimeType (though it usually is)
          const mime = part.inlineData.mimeType || 'image/png';
          generatedImageUrl = `data:${mime};base64,${base64EncodeString}`;
        } else if (part.text) {
          generatedText = part.text;
        }
      }
    }

    return {
      imageUrl: generatedImageUrl,
      text: generatedText
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
