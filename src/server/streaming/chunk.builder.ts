import type { ChatCompletionChunk, UsageInfo } from "../../types/openai.js";

export function buildChunkSequence(params: {
  id: string;
  model: string;
  created: number;
  textChunks: string[];
  includeUsage?: boolean;
  usage?: UsageInfo;
}): ChatCompletionChunk[] {
  const { id, model, created, textChunks, includeUsage, usage } = params;
  const chunks: ChatCompletionChunk[] = [];

  const base = {
    id,
    object: "chat.completion.chunk" as const,
    created,
    model,
    system_fingerprint: "fp_mock",
  };

  // First chunk: role announcement
  chunks.push({
    ...base,
    choices: [
      { index: 0, delta: { role: "assistant", content: "" }, finish_reason: null, logprobs: null },
    ],
  });

  // Content chunks
  for (const text of textChunks) {
    chunks.push({
      ...base,
      choices: [
        { index: 0, delta: { content: text }, finish_reason: null, logprobs: null },
      ],
    });
  }

  // Final chunk: finish_reason stop
  chunks.push({
    ...base,
    choices: [
      { index: 0, delta: {}, finish_reason: "stop", logprobs: null },
    ],
  });

  // Optional usage chunk
  if (includeUsage === true && usage !== undefined) {
    chunks.push({
      ...base,
      choices: [],
      usage,
    });
  }

  return chunks;
}
