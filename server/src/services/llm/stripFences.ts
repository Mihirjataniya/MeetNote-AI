/**
 * Some models (notably Llama-family on Groq) wrap their whole answer in a
 * ```markdown ... ``` fence despite the prompt forbidding it. Strip a single
 * outer fence so downstream storage/render gets clean markdown. Content that is
 * not fully fenced is returned untouched (trimmed).
 */
export function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^```[a-zA-Z]*\n([\s\S]*?)\n?```$/);
  return match ? match[1].trim() : trimmed;
}
