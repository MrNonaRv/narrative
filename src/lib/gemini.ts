import { GoogleGenAI } from "@google/genai";

export const GEMINI_MODEL = "gemini-3-flash-preview";

export async function generateContentWithRetry(ai: any, prompt: string, modelName: string = GEMINI_MODEL, maxRetries = 3, config?: any) {
  let delay = 1000;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        ...(config ? { config } : {})
      });
      return response;
    } catch (error: any) {
      if (error.message?.includes("429") || error.status === 429 || error.message?.includes("RESOURCE_EXHAUSTED")) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }
      throw error;
    }
  }
}
