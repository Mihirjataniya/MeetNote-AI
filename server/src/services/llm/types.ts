/**
 * A single LLM backend. Each provider owns its own transport, model selection,
 * and internal retry policy; the chain runner in ./index.ts sequences them for
 * cross-provider fallback.
 */
export interface LLMProvider {
  /** Stable identifier used in logs (e.g. "gemini", "groq"). */
  readonly name: string;
  /** Whether this provider has the credentials it needs to run. */
  readonly isConfigured: boolean;
  /**
   * Produce a completion for `prompt`. Should throw on transient/permanent
   * failure after exhausting its own internal retries — the chain runner
   * catches and moves to the next provider.
   */
  generate(prompt: string): Promise<string>;
}
