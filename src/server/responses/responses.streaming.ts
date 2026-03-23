import type { FastifyReply } from "fastify";
import type { ResponseObject } from "../../types/openai.js";
import { generateResponseId, generateMessageId } from "../utils/id.generator.js";
import { estimateTokens, estimatePromptTokens } from "../utils/token.counter.js";

function writeEvent(reply: FastifyReply, event: string, data: unknown): void {
  reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export function streamResponseChunks(
  reply: FastifyReply,
  model: string,
  chunks: string[],
  messages: Array<{ role: string; content: string | null }>,
  instructions?: string | null,
): void {
  reply.raw.writeHead(200, {
    "content-type": "text/event-stream",
    "cache-control": "no-cache",
    connection: "keep-alive",
  });
  reply.hijack();

  const responseId = generateResponseId();
  const msgId = generateMessageId();
  const createdAt = Date.now() / 1000;
  let seq = 0;

  const baseResponse: ResponseObject = {
    id: responseId,
    object: "response",
    created_at: createdAt,
    status: "in_progress",
    model,
    output: [],
    output_text: "",
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
    usage: null,
    user: null,
    service_tier: null,
  };

  // response.created
  writeEvent(reply, "response.created", {
    type: "response.created",
    response: baseResponse,
    sequence_number: seq++,
  });

  // response.in_progress
  writeEvent(reply, "response.in_progress", {
    type: "response.in_progress",
    response: baseResponse,
    sequence_number: seq++,
  });

  // response.output_item.added
  const msgItem = {
    id: msgId,
    type: "message",
    role: "assistant",
    status: "in_progress",
    content: [],
  };
  writeEvent(reply, "response.output_item.added", {
    type: "response.output_item.added",
    output_index: 0,
    item: msgItem,
    sequence_number: seq++,
  });

  // response.content_part.added
  const emptyPart = { type: "output_text", text: "", annotations: [] };
  writeEvent(reply, "response.content_part.added", {
    type: "response.content_part.added",
    item_id: msgId,
    output_index: 0,
    content_index: 0,
    part: emptyPart,
    sequence_number: seq++,
  });

  // response.output_text.delta — one per chunk
  for (const chunk of chunks) {
    writeEvent(reply, "response.output_text.delta", {
      type: "response.output_text.delta",
      item_id: msgId,
      output_index: 0,
      content_index: 0,
      delta: chunk,
      sequence_number: seq++,
    });
  }

  const fullText = chunks.join("");

  // response.output_text.done
  writeEvent(reply, "response.output_text.done", {
    type: "response.output_text.done",
    item_id: msgId,
    output_index: 0,
    content_index: 0,
    text: fullText,
    sequence_number: seq++,
  });

  // response.content_part.done
  const donePart = { type: "output_text", text: fullText, annotations: [] };
  writeEvent(reply, "response.content_part.done", {
    type: "response.content_part.done",
    item_id: msgId,
    output_index: 0,
    content_index: 0,
    part: donePart,
    sequence_number: seq++,
  });

  // response.output_item.done
  const doneMsg = {
    id: msgId,
    type: "message",
    role: "assistant",
    status: "completed",
    content: [donePart],
  };
  writeEvent(reply, "response.output_item.done", {
    type: "response.output_item.done",
    output_index: 0,
    item: doneMsg,
    sequence_number: seq++,
  });

  // response.completed — with usage
  const inputTokens = estimatePromptTokens(messages);
  const outputTokens = estimateTokens(fullText);
  const completedResponse: ResponseObject = {
    ...baseResponse,
    status: "completed",
    output: [
      {
        id: msgId,
        type: "message",
        role: "assistant",
        status: "completed",
        content: [{ type: "output_text", text: fullText, annotations: [] }],
      },
    ],
    output_text: fullText,
    usage: {
      input_tokens: inputTokens,
      input_tokens_details: { cached_tokens: 0 },
      output_tokens: outputTokens,
      output_tokens_details: { reasoning_tokens: 0 },
      total_tokens: inputTokens + outputTokens,
    },
  };

  writeEvent(reply, "response.completed", {
    type: "response.completed",
    response: completedResponse,
    sequence_number: seq++,
  });

  reply.raw.end();
}
