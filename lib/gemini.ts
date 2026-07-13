import "server-only";
import { GoogleGenerativeAI } from "@google/generative-ai";

// The free tier only has quota on the flash-lite alias (2.0-flash returns
// "limit: 0" quota errors), so pin to it.
const MODEL = "gemini-flash-lite-latest";

export interface GeminiResult {
  text: string | null;
  error: string | null;
}

/**
 * Gemini is strictly an explainer: it summarises and answers questions about
 * data the deterministic engines already produced. Every feature works when
 * the key is missing — callers must handle the error branch.
 */
export async function askGemini(
  prompt: string,
  context?: string
): Promise<GeminiResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      text: null,
      error: "GEMINI_API_KEY is not set on the server (.env.local).",
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: MODEL,
      systemInstruction:
        "You are the AgriFlow AI Assistant, a smart operations expert built " +
        "into the user's agricultural logistics dashboard. You analyse " +
        "real-time supply chain data, warehouse stock and demand forecasts.\n" +
        "Behaviour rules:\n" +
        "1. Speak clearly, professionally and helpfully about farm logistics.\n" +
        "2. Use only the exact data provided — never invent numbers.\n" +
        "3. If a data section is empty, say so and guide the user to the " +
        "right action (e.g. 'Record a harvest on the Harvests page' or " +
        "'Receive stock on the Inventory page').\n" +
        "4. Point out operational risks you notice, like stock close to " +
        "spoiling or unusual demand swings.\n" +
        "Keep answers short and practical for farmers, buyers, transporters " +
        "and warehouse staff.",
    });

    const fullPrompt = context
      ? `Data:\n${context}\n\nQuestion: ${prompt}`
      : prompt;

    const result = await model.generateContent(fullPrompt);
    return { text: result.response.text(), error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown Gemini API error";
    return { text: null, error: message };
  }
}
