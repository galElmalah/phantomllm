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

describe("OpenAI SDK - streaming", () => {
  it("streams text with OpenAI SDK", async () => {
    await fetch(`${baseUrl}/_admin/stubs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matcher: { endpoint: "chat" },
        response: {
          type: "streaming-chat",
          chunks: ["Hello", " ", "world", "!"],
        },
      }),
    });

    const stream = await client.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: "Hi" }],
      stream: true,
    });

    const collectedContent: string[] = [];
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        collectedContent.push(content);
      }
    }

    expect(collectedContent).toEqual(["Hello", " ", "world", "!"]);
    expect(collectedContent.join("")).toBe("Hello world!");
  });
});
