import type { EmbeddingResponse } from "../../types/openai.js";
import { estimateTokens } from "../utils/token.counter.js";

export function buildEmbeddingResponse(
  vectors: number[][],
  model: string,
  input: string | string[],
): EmbeddingResponse {
  const inputs = Array.isArray(input) ? input : [input];
  const promptTokens = inputs.reduce(
    (sum, text) => sum + estimateTokens(text),
    0,
  );

  return {
    object: "list",
    data: vectors.map((embedding, index) => ({
      object: "embedding" as const,
      index,
      embedding,
    })),
    model,
    usage: {
      prompt_tokens: promptTokens,
      total_tokens: promptTokens,
    },
  };
}
