import type { FastifyRequest, FastifyReply } from "fastify";
import type { ChatCompletionRequest } from "../../types/openai.js";
import type { RecordedRequest } from "../admin/admin.types.js";
import { buildChatCompletion } from "../responses/chat.response.js";
import { buildNoStubMatchResponse } from "../responses/error.response.js";
import { streamChunks } from "./chat.streaming.js";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function handleChatCompletion(
  request: FastifyRequest<{ Body: ChatCompletionRequest }>,
  reply: FastifyReply,
): Promise<void> {
  const { model, messages, stream, stream_options } = request.body;
  const registry = request.server.stubRegistry;

  const recorded: RecordedRequest = {
    timestamp: Date.now(),
    method: request.method,
    path: request.url,
    headers: request.headers as Record<string, string>,
    body: request.body,
  };
  registry.recordRequest(recorded);

  const stub = registry.findMatch("chat", model, messages);

  if (!stub) {
    const noMatch = buildNoStubMatchResponse(
      request.method,
      request.url,
      model,
      messages,
    );
    return reply.status(noMatch.status).send(noMatch.body);
  }

  if (stub.response.type === "error") {
    return reply.status(stub.response.status).send({
      error: {
        message: stub.response.error.message,
        type: stub.response.error.type,
        param: null,
        code: stub.response.error.code,
      },
    });
  }

  if (stub.delay > 0) {
    await delay(stub.delay);
  }

  if (stream === true) {
    const includeUsage = stream_options?.include_usage === true;
    const chunks: string[] =
      stub.response.type === "streaming-chat"
        ? stub.response.chunks
        : stub.response.type === "chat"
          ? stub.response.body.split(/(\s+)/).filter((s) => s.length > 0)
          : [];

    streamChunks(reply, model, chunks, messages, includeUsage);
    return;
  }

  if (stub.response.type === "chat") {
    return reply.send(buildChatCompletion(stub.response.body, model, messages));
  }

  if (stub.response.type === "streaming-chat") {
    const fullContent = stub.response.chunks.join("");
    return reply.send(buildChatCompletion(fullContent, model, messages));
  }
}
