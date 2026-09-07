import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Strips markdown code block wrappers (```json ... ```) if present.
 */
export function extractJsonFromResponse(rawResponse: string): string {
  if (!rawResponse) return "{}";
  const trimmed = rawResponse.trim();
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (match && match[1]) {
    return match[1].trim();
  }
  return trimmed;
}

export interface GeminiCallOptions {
  apiKey?: string;
  modelName?: string;
  temperature?: number;
}

export const DEFAULT_GEMINI_MODELS = ["gemini-3.6-flash"];

/**
 * Calls Google Gemini API with JSON response format enforced.
 */
export async function generateGeminiJson(
  prompt: string,
  options?: GeminiCallOptions,
): Promise<string> {
  const apiKey = options?.apiKey || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Gemini API key is not configured. Please set GEMINI_API_KEY environment variable or provide it in options.",
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const preferredModel =
    options?.modelName || process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODELS[0];

  const modelsToTry = [
    preferredModel,
    ...DEFAULT_GEMINI_MODELS.filter((m) => m !== preferredModel),
  ];

  let lastError: Error | null = null;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: options?.temperature ?? 0.2,
        },
      });

      const response = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      const text = response.response.text();
      return extractJsonFromResponse(text);
    } catch (err: unknown) {
      const error = err as Error;
      lastError = error;
      console.warn(
        `Model ${modelName} failed, attempting fallback:`,
        error.message,
      );
      // If error is authentication error, don't keep retrying other models
      if (
        error.message.includes("API_KEY_INVALID") ||
        error.message.includes("401")
      ) {
        throw error;
      }
    }
  }

  throw (
    lastError || new Error("Failed to generate content with Gemini models.")
  );
}
