
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const getSeatingAdvice = async (students: string[], currentLayout: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        As a professional classroom management consultant, provide 3 short, creative tips for seating the following students:
        Students: ${students.join(", ")}
        Current Layout Idea: ${currentLayout}
        
        Focus on:
        1. Peer learning opportunities.
        2. Managing classroom energy.
        3. Accessibility and sightlines.
        Keep the response in Korean and friendly.
      `,
      config: {
        temperature: 0.7,
        topP: 0.95,
      }
    });

    return response.text || "AI 추천을 가져올 수 없습니다.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI 분석 중 오류가 발생했습니다. 나중에 다시 시도해주세요.";
  }
};
