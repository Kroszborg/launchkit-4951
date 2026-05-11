import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { LanguageModel } from "ai";

const provider = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// @ai-sdk/google@1.x returns LanguageModelV1; ai@6.x expects LanguageModelV2.
// The runtime API is fully compatible — this cast bridges the type gap.
export function google(model: string): LanguageModel {
  return provider(model) as unknown as LanguageModel;
}
