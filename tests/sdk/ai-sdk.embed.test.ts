import { beforeAll, afterAll, afterEach, describe, it, expect } from "vitest";
import { buildApp } from "../../src/server/app.js";
import type { FastifyInstance } from "fastify";
import { createOpenAI } from "@ai-sdk/openai";
import { embed } from "ai";

let app: FastifyInstance;
let baseUrl: string;

beforeAll(async () => {
  app = await buildApp({ logger: false });
  await app.listen({ port: 0 });
  const address = app.server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  await app.close();
});

afterEach(async () => {
  await fetch(`${baseUrl}/_admin/stubs`, { method: "DELETE" });
  await fetch(`${baseUrl}/_admin/requests`, { method: "DELETE" });
});

describe("Vercel AI SDK - embed", () => {
  it("creates embeddings with AI SDK", async () => {
    const vector = [0.1, 0.2, 0.3, 0.4, 0.5];
    await fetch(`${baseUrl}/_admin/stubs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matcher: { endpoint: "embeddings" },
        response: { type: "embedding", vectors: [vector] },
      }),
    });

    const provider = createOpenAI({
      baseURL: `${baseUrl}/v1`,
      apiKey: "test-key",
    });

    const result = await embed({
      model: provider.embedding("text-embedding-3-small"),
      value: "Hello world",
    });

    expect(result.embedding).toEqual(vector);
  });
});
