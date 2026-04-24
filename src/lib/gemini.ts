import { GoogleGenAI } from "@google/genai";

export const GEMINI_MODEL = "gemini-3-flash-preview";

export async function generateContentWithRetry(ai: any, prompt: string, modelName: string = GEMINI_MODEL, maxRetries = 5, config?: any) {
  let delay = 4000;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        ...(config ? { config } : {})
      });
      return response;
    } catch (error: any) {
      const isQuota = error?.message?.includes("exceeded your current quota") || error?.message?.includes("quota") || error?.status === "RESOURCE_EXHAUSTED";
      const isRateLimit = error?.message?.includes("429") || error?.status === 429;
      
      if (isQuota || isRateLimit) {
        if (i === maxRetries - 1) {
          throw new Error("Gemini API Quota Exceeded. Please try again later or provide your own API key.");
        }
        await new Promise(resolve => setTimeout(resolve, delay));
        delay += 5000;
        continue;
      }
      throw error;
    }
  }
}
