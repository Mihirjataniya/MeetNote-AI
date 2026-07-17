import { config } from "../../config/index";
import type { LLMProvider } from "./types";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

interface GroqChatResponse {
  choices?: { message?: { content?: string } }[];
}

/**
 * Fallback provider. Groq exposes an OpenAI-compatible Chat Completions API, so
 * this is a thin fetch wrapper — no SDK dependency. Retries once on transient
 * errors (429/503); other statuses fail immediately and let the chain runner
 * decide there's nothing left to try.
 */
export class GroqProvider implements LLMProvider {
  readonly name = "groq";

  get isConfigured(): boolean {
    return Boolean(config.groq.apiKey);
  }

  async generate(prompt: string): Promise<string> {
    const maxRetries = 1;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.groq.apiKey}`,
        },
        body: JSON.stringify({
          model: config.groq.model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as GroqChatResponse;
        const content = data.choices?.[0]?.message?.content;
        if (!content) {
          throw new Error("Groq returned no content");
        }
        return content;
      }

      const body = await res.text().catch(() => "");
      if ((res.status === 429 || res.status === 503) && attempt < maxRetries) {
        const delayMs = 5_000;
        console.warn(
          `[LLM:groq] ${res.status}, retrying in ${delayMs / 1000}s (attempt ${attempt + 1}/${maxRetries})`
        );
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }

      const err = new Error(`Groq API ${res.status}: ${body.slice(0, 200)}`);
      (err as { status?: number }).status = res.status;
      throw err;
    }

    throw new Error("Unreachable");
  }
}
