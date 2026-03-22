import type { FastifyRequest, FastifyReply } from "fastify";
import type { EmbeddingRequest } from "../../types/openai.js";
import type { RecordedRequest } from "../admin/admin.types.js";
import { buildEmbeddingResponse } from "../responses/embedding.response.js";

const DEFAULT_DIMENSION = 1536;

function zeroVector(dim: number): number[] {
  return new Array<number>(dim).fill(0);
}

export async function handleEmbeddings(
  request: FastifyRequest<{ Body: EmbeddingRequest }>,
  reply: FastifyReply,
): Promise<void> {
  const { model, input } = request.body;
  const registry = request.server.stubRegistry;

  const recorded: RecordedRequest = {
    timestamp: Date.now(),
    method: request.method,
    path: request.url,
    headers: request.headers as Record<string, string>,
    body: request.body,
  };
  registry.recordRequest(recorded);

  const stub = registry.findMatch("embeddings", model, undefined, input);

  if (stub && stub.response.type === "error") {
    return reply.status(stub.response.status).send({
      error: {
        message: stub.response.error.message,
        type: stub.response.error.type,
        param: null,
        code: stub.response.error.code,
      },
    });
  }

  if (stub && stub.response.type === "embedding") {
    return reply.send(
      buildEmbeddingResponse(stub.response.vectors, model, input),
    );
  }

  const inputs = Array.isArray(input) ? input : [input];
  const vectors = inputs.map(() => zeroVector(DEFAULT_DIMENSION));
  return reply.send(buildEmbeddingResponse(vectors, model, input));
}
