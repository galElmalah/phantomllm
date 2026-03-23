import type { ResponseObject, ResponseInputMessage } from "../../types/openai.js";
import { generateResponseId, generateMessageId } from "../utils/id.generator.js";
import { estimateTokens, estimatePromptTokens } from "../utils/token.counter.js";

export function inputToMessages(
  input: string | ResponseInputMessage[],
  instructions?: string | null,
): Array<{ role: string; content: string | null }> {
  const messages: Array<{ role: string; content: string | null }> = [];

  if (instructions) {
    messages.push({ role: "system", content: instructions });
  }

  if (typeof input === "string") {
    messages.push({ role: "user", content: input });
  } else {
    for (const item of input) {
      messages.push({ role: item.role, content: item.content });
    }
  }

  return messages;
}

export function buildResponseObject(
  content: string,
  model: string,
  messages: Array<{ role: string; content: string | null }>,
  instructions?: string | null,
): ResponseObject {
  const outputTokens = estimateTokens(content);
  const inputTokens = estimatePromptTokens(messages);
  const msgId = generateMessageId();

  return {
    id: generateResponseId(),
    object: "response",
    created_at: Date.now() / 1000,
    status: "completed",
    model,
    output: [
      {
        id: msgId,
        type: "message",
        role: "assistant",
        status: "completed",
        content: [
          {
            type: "output_text",
            text: content,
            annotations: [],
          },
        ],
      },
    ],
    output_text: content,
    error: null,
    incomplete_details: null,
    instructions: instructions ?? null,
    metadata: {},
    parallel_tool_calls: true,
    temperature: 1.0,
    top_p: 1.0,
    max_output_tokens: null,
    previous_response_id: null,
    reasoning: null,
    text: null,
    truncation: null,
    tool_choice: "auto",
    tools: [],
    usage: {
      input_tokens: inputTokens,
      input_tokens_details: { cached_tokens: 0 },
      output_tokens: outputTokens,
      output_tokens_details: { reasoning_tokens: 0 },
      total_tokens: inputTokens + outputTokens,
    },
    user: null,
    service_tier: null,
  };
}
