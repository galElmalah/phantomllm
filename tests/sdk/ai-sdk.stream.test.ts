import { beforeAll, afterAll, afterEach, describe, it, expect } from "vitest";
import { buildApp } from "../../src/server/app.js";
import type { FastifyInstance } from "fastify";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

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

describe("Vercel AI SDK - streamText", () => {
  it("streams text with AI SDK", async () => {
    await fetch(`${baseUrl}/_admin/stubs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matcher: { endpoint: "chat" },
        response: {
          type: "streaming-chat",
          chunks: ["Hello", " ", "from", " ", "stream"],
        },
      }),
    });

    const provider = createOpenAI({
      baseURL: `${baseUrl}/v1`,
      apiKey: "test-key",
    });

    const result = streamText({
      model: provider.chat("gpt-4"),
      prompt: "Say hello",
    });

    const collectedParts: string[] = [];
    for await (const textPart of result.textStream) {
      collectedParts.push(textPart);
    }

    const fullText = collectedParts.join("");
    expect(fullText).toBe("Hello from stream");
  });
});
