import type { ChatCompletionResponse } from "../../types/openai.js";
import { generateChatCompletionId } from "../utils/id.generator.js";
import { estimateTokens, estimatePromptTokens } from "../utils/token.counter.js";

export function buildChatCompletion(
  content: string,
  model: string,
  messages?: Array<{ role: string; content: string | null }>,
): ChatCompletionResponse {
  const completionTokens = estimateTokens(content);
  const promptTokens = messages ? estimatePromptTokens(messages) : 0;

  return {
    id: generateChatCompletionId(),
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model,
    system_fingerprint: "fp_mock",
    choices: [
      {
        index: 0,
        message: { role: "assistant", content },
        finish_reason: "stop",
        logprobs: null,
      },
    ],
    usage: {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens,
    },
  };
}
