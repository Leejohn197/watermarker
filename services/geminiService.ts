import { GoogleGenAI } from "@google/genai";
import { ProcessingMode } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

export const removeWatermark = async (
  base64Image: string, 
  mimeType: string,
  mode: ProcessingMode = ProcessingMode.WATERMARK,
  customInstruction?: string
): Promise<string> => {
  const ai = getClient();
  
  // High-End Smartphone "Magic Eraser" Logic
  const systemPrompt = `You are an advanced AI Eraser tool, functionally equivalent to the "Magic Eraser" or "Generative Erase" features found on flagship smartphones.

YOUR CORE FUNCTION:
Perform "Content-Aware Object Removal". You must detect artificial overlays and completely erase them, then synthesize the missing pixels to match the surrounding background (Inpainting).

ALGORITHM RULES:
1.  **Detection & Segmentation**: Aggressively scan the image for:
    *   **Corner Watermarks**: Specifically look for small icons (e.g., the Gemini sparkle logo, brand logos) in the bottom-right or other corners.
    *   **AI Artifacts**: Detect text strips, color bars, or "Made with AI" badges.
    *   **Translucent Overlays**: Identify semi-transparent copyright patterns covering the main subject.
2.  **Generative Inpainting**:
    *   After removing the object, reconstruct the background using texture synthesis.
    *   Analyze neighboring pixels (gradient, noise, pattern) to fill the void seamlessly.
    *   Ensure the lighting and shadows remain consistent with the scene.
3.  **Fidelity**: The output must look like the original raw photograph. No blurriness, no ghosting.

Output ONLY the final processed image.`;
  
  let basePrompt = "";
  switch (mode) {
    case ProcessingMode.STICKER:
      basePrompt = "Detect and remove all stickers, emojis, and graphic overlays. Reconstruct the occluded areas (faces, clothes, scenery) naturally.";
      break;
    case ProcessingMode.TEXT:
      basePrompt = "Erase all overlaid text, subtitles, and captions. Distinguish between scene text (like street signs) and digital overlays. Remove only the digital overlays unless instructed otherwise.";
      break;
    case ProcessingMode.GENERAL:
      basePrompt = "Perform a general cleanup. Remove visual noise, specks, and distracting objects from the periphery.";
      break;
    case ProcessingMode.WATERMARK:
    default:
      // Specific targeting for the user's request (Gemini icons, etc)
      basePrompt = "Aggressively detect and remove all watermarks. PAY SPECIAL ATTENTION TO THE CORNERS for icons (like the Gemini sparkle/star icon), logos, and AI generation signatures. Remove them completely and reconstruct the background texture.";
      break;
  }

  // Construct the final user prompt
  const userPrompt = customInstruction 
    ? `Operation: ${basePrompt} \n\nSpecific Priority Instruction: ${customInstruction}. \n\nExecution: Generative Erase & Inpaint.`
    : `Operation: ${basePrompt} \n\nExecution: Generative Erase & Inpaint. Ensure invisible restoration.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image
            }
          },
          {
            text: userPrompt
          }
        ]
      },
      config: {
        systemInstruction: systemPrompt,
        // Lower temperature for high precision and stability (less hallucination)
        temperature: 0.1, 
      }
    });

    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const content = candidates[0].content;
      if (content && content.parts) {
        for (const part of content.parts) {
          if (part.inlineData && part.inlineData.data) {
            const responseMimeType = part.inlineData.mimeType || 'image/png';
            return `data:${responseMimeType};base64,${part.inlineData.data}`;
          }
        }
        
        const textPart = content.parts.find(p => p.text);
        if (textPart && textPart.text) {
           if (textPart.text.includes("policy") || textPart.text.includes("safety")) {
             throw new Error("Safety Guard: The image could not be processed due to content restrictions.");
           }
           throw new Error(`AI Processing Message: ${textPart.text}`);
        }
      }
    }
    
    throw new Error("The AI processing failed to generate a result. Please try again.");

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};