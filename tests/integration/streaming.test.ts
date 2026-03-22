import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { buildApp } from "../../src/server/app.js";
import type { FastifyInstance } from "fastify";

function parseSSE(body: string): unknown[] {
  return body
    .split("\n\n")
    .filter((block) => block.startsWith("data: "))
    .map((block) => block.slice(6))
    .filter((data) => data !== "[DONE]")
    .map((data) => JSON.parse(data));
}

function rawSSELines(body: string): string[] {
  return body
    .split("\n\n")
    .filter((block) => block.startsWith("data: "))
    .map((block) => block.slice(6));
}

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

async function registerStreamingStubViaHttp(
  chunks: string[],
  model?: string,
): Promise<void> {
  const matcher: Record<string, unknown> = { endpoint: "chat" };
  if (model) matcher.model = model;

  await fetch(`${baseUrl}/_admin/stubs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      matcher,
      response: { type: "streaming-chat", chunks },
    }),
  });
}

describe("streaming chat completions", () => {
  it("streams chat completion chunks", async () => {
    await registerStreamingStubViaHttp(["Hello", " ", "world"]);

    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: "Hi" }],
        stream: true,
      }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");

    const body = await res.text();
    const chunks = parseSSE(body);
    // 3 content chunks + 1 final chunk with finish_reason
    expect(chunks.length).toBe(4);

    const contentPieces = chunks
      .slice(0, 3)
      .map((c: any) => c.choices[0].delta.content);
    expect(contentPieces).toEqual(["Hello", " ", "world"]);
  });

  it("sends [DONE] as final event", async () => {
    await registerStreamingStubViaHttp(["Hi"]);

    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: "Hi" }],
        stream: true,
      }),
    });

    const body = await res.text();
    const lines = rawSSELines(body);
    expect(lines[lines.length - 1]).toBe("[DONE]");
  });

  it("first chunk has assistant role", async () => {
    await registerStreamingStubViaHttp(["Hello"]);

    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: "Hi" }],
        stream: true,
      }),
    });

    const body = await res.text();
    const chunks = parseSSE(body);
    const firstChunk = chunks[0] as any;
    expect(firstChunk.choices[0].delta.role).toBe("assistant");
  });

  it("last content chunk has finish_reason stop", async () => {
    await registerStreamingStubViaHttp(["Hi"]);

    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: "Hi" }],
        stream: true,
      }),
    });

    const body = await res.text();
    const chunks = parseSSE(body);
    const lastChunk = chunks[chunks.length - 1] as any;
    expect(lastChunk.choices[0].finish_reason).toBe("stop");
  });
});
