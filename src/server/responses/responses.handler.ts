import type { FastifyRequest, FastifyReply } from "fastify";
import type { ResponseRequest } from "../../types/openai.js";
import type { RecordedRequest } from "../admin/admin.types.js";
import { buildResponseObject, inputToMessages } from "./responses.response.js";
import { buildNoStubMatchResponse } from "./error.response.js";
import { streamResponseChunks } from "./responses.streaming.js";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function handleResponse(
  request: FastifyRequest<{ Body: ResponseRequest }>,
  reply: FastifyReply,
): Promise<void> {
  const { model, input, instructions, stream } = request.body;
  const registry = request.server.stubRegistry;

  const recorded: RecordedRequest = {
    timestamp: Date.now(),
    method: request.method,
    path: request.url,
    headers: request.headers as Record<string, string>,
    body: request.body,
  };
  registry.recordRequest(recorded);

  const messages = inputToMessages(input, instructions);

  // Reuse chat stubs — responses API serves the same purpose
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
    const chunks: string[] =
      stub.response.type === "streaming-chat"
        ? stub.response.chunks
        : stub.response.type === "chat"
          ? stub.response.body.split(/(\s+)/).filter((s) => s.length > 0)
          : [];

    streamResponseChunks(reply, model, chunks, messages, instructions);
    return;
  }

  if (stub.response.type === "chat") {
    return reply.send(
      buildResponseObject(stub.response.body, model, messages, instructions),
    );
  }

  if (stub.response.type === "streaming-chat") {
    const fullContent = stub.response.chunks.join("");
    return reply.send(
      buildResponseObject(fullContent, model, messages, instructions),
    );
  }
}
