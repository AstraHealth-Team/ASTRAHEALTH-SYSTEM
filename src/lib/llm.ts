/**
 * Hook point for a future external LLM (e.g. Lovable AI).
 *
 * Today it returns `null`, so the voice assistant uses the on-board rule engine
 * in `triage.ts` and works offline with no API keys — as it would on a Mars transit.
 *
 * To connect a model later: implement this through a server function
 * (never put an API key in browser code) and return the assistant's reply text.
 */
export interface LlmContext {
  system: string;
  history: { role: "ia" | "usuario"; text: string }[];
}

export async function queryExternalLLM(prompt: string, context?: LlmContext): Promise<string | null> {
  void prompt;
  void context;
  return null;
}
