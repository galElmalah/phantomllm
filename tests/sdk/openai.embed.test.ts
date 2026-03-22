import { beforeAll, afterAll, afterEach, describe, it, expect } from "vitest";
import { buildApp } from "../../src/server/app.js";
import type { FastifyInstance } from "fastify";
import OpenAI from "openai";

let app: FastifyInstance;
let client: OpenAI;
let baseUrl: string;

beforeAll(async () => {
  app = await buildApp({ logger: false });
  await app.listen({ port: 0 });
  const address = app.server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  baseUrl = `http://127.0.0.1:${port}`;
  client = new OpenAI({ baseURL: `${baseUrl}/v1`, apiKey: "test-key" });
});

afterAll(async () => {
  await app.close();
});

afterEach(async () => {
  await fetch(`${baseUrl}/_admin/stubs`, { method: "DELETE" });
  await fetch(`${baseUrl}/_admin/requests`, { method: "DELETE" });
});

describe("OpenAI SDK - embeddings", () => {
  it("creates embeddings with OpenAI SDK", async () => {
    const vector = [0.1, 0.2, 0.3, 0.4, 0.5];
    await fetch(`${baseUrl}/_admin/stubs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matcher: { endpoint: "embeddings" },
        response: { type: "embedding", vectors: [vector] },
      }),
    });

    const result = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: "Hello world",
      encoding_format: "float",
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.embedding).toEqual(vector);
    expect(result.model).toBe("text-embedding-3-small");
  });
});
