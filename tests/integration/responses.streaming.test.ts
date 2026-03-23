import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { buildApp } from "../../src/server/app.js";
import type { FastifyInstance } from "fastify";

interface SSEEvent {
  event: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
}

function parseResponseSSE(body: string): SSEEvent[] {
  const events: SSEEvent[] = [];
  const blocks = body.split("\n\n").filter((b) => b.trim().length > 0);
  for (const block of blocks) {
    const lines = block.split("\n");
    let event = "";
    let data = "";
    for (const line of lines) {
      if (line.startsWith("event: ")) event = line.slice(7);
      if (line.startsWith("data: ")) data = line.slice(6);
    }
    if (event && data) {
      events.push({ event, data: JSON.parse(data) });
    }
  }
  return events;
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

async function registerStreamingStub(chunks: string[]): Promise<void> {
  await fetch(`${baseUrl}/_admin/stubs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      matcher: { endpoint: "chat" },
      response: { type: "streaming-chat", chunks },
    }),
  });
}

describe("streaming responses API", () => {
  it("streams with correct event sequence", async () => {
    await registerStreamingStub(["Hello", " ", "world"]);

    const res = await fetch(`${baseUrl}/v1/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o",
        input: "Hi",
        stream: true,
      }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");

    const body = await res.text();
    const events = parseResponseSSE(body);

    // Expected event sequence
    const eventTypes = events.map((e) => e.event);
    expect(eventTypes).toEqual([
      "response.created",
      "response.in_progress",
      "response.output_item.added",
      "response.content_part.added",
      "response.output_text.delta",
      "response.output_text.delta",
      "response.output_text.delta",
      "response.output_text.done",
      "response.content_part.done",
      "response.output_item.done",
      "response.completed",
    ]);
  });

  it("delta events contain correct text chunks", async () => {
    await registerStreamingStub(["Hello", " ", "world"]);

    const res = await fetch(`${baseUrl}/v1/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o",
        input: "Hi",
        stream: true,
      }),
    });

    const body = await res.text();
    const events = parseResponseSSE(body);

    const deltas = events
      .filter((e) => e.event === "response.output_text.delta")
      .map((e) => e.data.delta);
    expect(deltas).toEqual(["Hello", " ", "world"]);
  });

  it("response.completed event has usage", async () => {
    await registerStreamingStub(["Hi"]);

    const res = await fetch(`${baseUrl}/v1/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o",
        input: "Hello",
        stream: true,
      }),
    });

    const body = await res.text();
    const events = parseResponseSSE(body);

    const completed = events.find((e) => e.event === "response.completed");
    expect(completed).toBeDefined();
    expect(completed!.data.response.status).toBe("completed");
    expect(completed!.data.response.usage).toBeDefined();
    expect(completed!.data.response.usage.total_tokens).toBeGreaterThan(0);
  });

  it("response.output_text.done has full text", async () => {
    await registerStreamingStub(["Hello", " world"]);

    const res = await fetch(`${baseUrl}/v1/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o",
        input: "Hi",
        stream: true,
      }),
    });

    const body = await res.text();
    const events = parseResponseSSE(body);

    const done = events.find((e) => e.event === "response.output_text.done");
    expect(done).toBeDefined();
    expect(done!.data.text).toBe("Hello world");
  });

  it("sequence numbers are monotonically increasing", async () => {
    await registerStreamingStub(["A", "B"]);

    const res = await fetch(`${baseUrl}/v1/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o",
        input: "Hi",
        stream: true,
      }),
    });

    const body = await res.text();
    const events = parseResponseSSE(body);
    const seqs = events.map((e) => e.data.sequence_number);

    for (let i = 1; i < seqs.length; i++) {
      expect(seqs[i]).toBeGreaterThan(seqs[i - 1]!);
    }
  });

  it("response IDs are consistent across events", async () => {
    await registerStreamingStub(["Hi"]);

    const res = await fetch(`${baseUrl}/v1/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o",
        input: "Hi",
        stream: true,
      }),
    });

    const body = await res.text();
    const events = parseResponseSSE(body);

    const created = events.find((e) => e.event === "response.created");
    const completed = events.find((e) => e.event === "response.completed");
    expect(created!.data.response.id).toBe(completed!.data.response.id);
  });
});
