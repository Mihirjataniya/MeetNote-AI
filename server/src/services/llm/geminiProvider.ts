import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../../config/index";
import type { LLMProvider } from "./types";

/**
 * Primary provider. Retries once on transient errors (429 rate limit, 503
 * overloaded). Because a fallback provider is waiting behind this one, the
 * backoff is deliberately short — we'd rather hand off to Groq than sit through
 * a long wait on a throttled Gemini.
 */
export class GeminiProvider implements LLMProvider {
  readonly name = "gemini";
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
  }

  get isConfigured(): boolean {
    return Boolean(config.gemini.apiKey);
  }

  async generate(prompt: string): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: config.gemini.model });
    const maxRetries = 1;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (err: unknown) {
        const status = (err as { status?: number }).status;
        if ((status === 429 || status === 503) && attempt < maxRetries) {
          const delayMs = 15_000;
          console.warn(
            `[LLM:gemini] ${status}, retrying in ${delayMs / 1000}s (attempt ${attempt + 1}/${maxRetries})`
          );
          await new Promise((r) => setTimeout(r, delayMs));
          continue;
        }
        throw err;
      }
    }

    throw new Error("Unreachable");
  }
}
