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

describe("OpenAI SDK - chat completions", () => {
  it("generates text with OpenAI SDK", async () => {
    await fetch(`${baseUrl}/_admin/stubs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matcher: { endpoint: "chat" },
        response: { type: "chat", body: "Hello from mock server!" },
      }),
    });

    const completion = await client.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: "Say hello" }],
    });

    expect(completion.choices).toHaveLength(1);
    expect(completion.choices[0]?.message.content).toBe(
      "Hello from mock server!",
    );
    expect(completion.choices[0]?.finish_reason).toBe("stop");
    expect(completion.model).toBe("gpt-4");
  });

  it("handles error responses", async () => {
    await fetch(`${baseUrl}/_admin/stubs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matcher: { endpoint: "chat" },
        response: {
          type: "error",
          status: 429,
          error: {
            message: "Rate limit exceeded",
            type: "rate_limit_error",
            code: null,
          },
        },
      }),
    });

    await expect(
      client.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: "Hi" }],
      }),
    ).rejects.toThrow();
  });
});
