
import { GoogleGenAI, Type } from "@google/genai";

// Fix: Always use the required initialization format for GoogleGenAI
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function brainstormVideoTitles(idea: string, platform: string): Promise<string[]> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `I am a video editor. Brainstorm 5 catchy, viral-optimized video titles for this idea: "${idea}" on the platform "${platform}". Provide only the titles as a list.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });

    const text = response.text;
    if (!text) return ["No suggestions found."];
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return ["Failed to generate ideas. Please try again later."];
  }
}
