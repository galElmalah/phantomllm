import type { FastifyReply } from "fastify";
import type { ChatCompletionChunk } from "../../types/openai.js";
import { generateChatCompletionId } from "../utils/id.generator.js";
import {
  estimateTokens,
  estimatePromptTokens,
} from "../utils/token.counter.js";
import type { ChatMessage } from "../../types/openai.js";

function buildChunk(
  id: string,
  model: string,
  content: string,
  finishReason: "stop" | null,
  usage?: ChatCompletionChunk["usage"],
): ChatCompletionChunk {
  return {
    id,
    object: "chat.completion.chunk",
    created: Math.floor(Date.now() / 1000),
    model,
    system_fingerprint: "fp_mock",
    choices: [
      {
        index: 0,
        delta: finishReason === null ? { role: "assistant", content } : {},
        finish_reason: finishReason,
        logprobs: null,
      },
    ],
    usage: usage ?? null,
  };
}

function writeSSE(reply: FastifyReply, chunk: ChatCompletionChunk): void {
  reply.raw.write(`data: ${JSON.stringify(chunk)}\n\n`);
}

export function streamChunks(
  reply: FastifyReply,
  model: string,
  chunks: string[],
  messages: ChatMessage[],
  includeUsage: boolean,
): void {
  reply.raw.writeHead(200, {
    "content-type": "text/event-stream",
    "cache-control": "no-cache",
    connection: "keep-alive",
  });
  reply.hijack();

  const id = generateChatCompletionId();

  for (const word of chunks) {
    writeSSE(reply, buildChunk(id, model, word, null));
  }

  const fullContent = chunks.join("");
  const completionTokens = estimateTokens(fullContent);
  const promptTokens = estimatePromptTokens(messages);
  const usage = includeUsage
    ? {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens,
      }
    : undefined;

  writeSSE(reply, buildChunk(id, model, "", "stop", usage));
  reply.raw.write("data: [DONE]\n\n");
  reply.raw.end();
}
