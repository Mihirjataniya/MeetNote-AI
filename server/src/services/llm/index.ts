import type { LLMProvider } from "./types";
import { GeminiProvider } from "./geminiProvider";
import { GroqProvider } from "./groqProvider";
import { stripCodeFences } from "./stripFences";

/**
 * Ordered fallback chain: Gemini primary, Groq fallback. Order is intentionally
 * hardcoded — Gemini gives the best notes quality today, Groq exists purely as a
 * backstop for Gemini outages / rate limits. To reorder or add a provider, edit
 * this list.
 */
const CHAIN: LLMProvider[] = [new GeminiProvider(), new GroqProvider()];

/** Providers that have credentials, in fallback order. */
export function activeProviders(): LLMProvider[] {
  return CHAIN.filter((p) => p.isConfigured);
}

/**
 * Try each configured provider in order; return the first successful,
 * fence-stripped, non-empty completion. Throws only when every provider fails
 * (or none is configured) so the caller can mark the job failed for retry/DLQ.
 */
export async function generateWithFallback(prompt: string): Promise<string> {
  const providers = activeProviders();
  if (providers.length === 0) {
    throw new Error(
      "No LLM provider configured — set GEMINI_API_KEY and/or GROQ_API_KEY"
    );
  }

  let lastErr: unknown;
  for (const provider of providers) {
    try {
      const raw = await provider.generate(prompt);
      const text = stripCodeFences(raw);
      if (!text) {
        throw new Error(`${provider.name} returned empty content`);
      }
      console.log(`[LLM] Generated via ${provider.name} (${text.length} chars)`);
      return text;
    } catch (err) {
      lastErr = err;
      console.warn(
        `[LLM] Provider ${provider.name} failed, trying next:`,
        err instanceof Error ? err.message : err
      );
    }
  }

  throw new Error(
    `All LLM providers failed. Last error: ${lastErr instanceof Error ? lastErr.message : String(lastErr)}`
  );
}
