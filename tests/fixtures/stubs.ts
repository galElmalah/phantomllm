import type { FastifyInstance } from "fastify";

export async function registerChatStub(
  app: FastifyInstance,
  content: string,
  model?: string,
  contentMatch?: string,
): Promise<void> {
  const matcher: Record<string, unknown> = { endpoint: "chat" };
  if (model) matcher.model = model;
  if (contentMatch) matcher.content = contentMatch;

  await app.inject({
    method: "POST",
    url: "/_admin/stubs",
    payload: {
      matcher,
      response: { type: "chat", body: content },
    },
  });
}

export async function registerStreamingStub(
  app: FastifyInstance,
  chunks: string[],
  model?: string,
): Promise<void> {
  const matcher: Record<string, unknown> = { endpoint: "chat" };
  if (model) matcher.model = model;

  await app.inject({
    method: "POST",
    url: "/_admin/stubs",
    payload: {
      matcher,
      response: { type: "streaming-chat", chunks },
    },
  });
}

export async function registerEmbeddingStub(
  app: FastifyInstance,
  vectors: number[][],
  model?: string,
): Promise<void> {
  const matcher: Record<string, unknown> = { endpoint: "embeddings" };
  if (model) matcher.model = model;

  await app.inject({
    method: "POST",
    url: "/_admin/stubs",
    payload: {
      matcher,
      response: { type: "embedding", vectors },
    },
  });
}

export async function registerErrorStub(
  app: FastifyInstance,
  status: number,
  message: string,
  model?: string,
  endpoint: "chat" | "embeddings" = "chat",
): Promise<void> {
  const matcher: Record<string, unknown> = { endpoint };
  if (model) matcher.model = model;

  await app.inject({
    method: "POST",
    url: "/_admin/stubs",
    payload: {
      matcher,
      response: {
        type: "error",
        status,
        error: { message, type: "api_error", code: null },
      },
    },
  });
}
