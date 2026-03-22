import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { buildApp } from "../../src/server/app.js";
import type { FastifyInstance } from "fastify";

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
  await fetch(`${baseUrl}/_admin/config`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey: null }),
  });
});

async function setApiKey(key: string): Promise<void> {
  await fetch(`${baseUrl}/_admin/config`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey: key }),
  });
}

async function addChatStub(content: string): Promise<void> {
  await fetch(`${baseUrl}/_admin/stubs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      matcher: { endpoint: "chat" },
      response: { type: "chat", body: content },
    }),
  });
}

describe("api key validation (expect.apiKey)", () => {
  it("rejects requests without Authorization header", async () => {
    await setApiKey("test-secret");

    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: "Hi" }],
      }),
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("missing_api_key");
  });

  it("rejects requests with wrong api key", async () => {
    await setApiKey("correct-key");

    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer wrong-key",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: "Hi" }],
      }),
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("invalid_api_key");
  });

  it("allows requests with correct api key", async () => {
    await setApiKey("correct-key");
    await addChatStub("authenticated!");

    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer correct-key",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: "Hi" }],
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.choices[0].message.content).toBe("authenticated!");
  });

  it("admin routes bypass api key validation", async () => {
    await setApiKey("secret");

    const res = await fetch(`${baseUrl}/_admin/health`);
    expect(res.status).toBe(200);
  });

  it("allows all requests when no apiKey is configured", async () => {
    await addChatStub("open access");

    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: "Hi" }],
      }),
    });

    expect(res.status).toBe(200);
  });

  it("validates on embeddings endpoint", async () => {
    await setApiKey("embed-key");

    const noAuth = await fetch(`${baseUrl}/v1/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "text-embedding-3-small", input: "test" }),
    });
    expect(noAuth.status).toBe(401);

    const withAuth = await fetch(`${baseUrl}/v1/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer embed-key",
      },
      body: JSON.stringify({ model: "text-embedding-3-small", input: "test" }),
    });
    expect(withAuth.status).toBe(200);
  });

  it("validates on models endpoint", async () => {
    await setApiKey("models-key");

    const noAuth = await fetch(`${baseUrl}/v1/models`);
    expect(noAuth.status).toBe(401);

    const withAuth = await fetch(`${baseUrl}/v1/models`, {
      headers: { Authorization: "Bearer models-key" },
    });
    expect(withAuth.status).toBe(200);
  });

  it("can disable validation by clearing the key", async () => {
    await setApiKey("temporary-key");

    const blocked = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: "Hi" }],
      }),
    });
    expect(blocked.status).toBe(401);

    // Clear the key
    await fetch(`${baseUrl}/_admin/config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: null }),
    });

    await addChatStub("open again");

    const open = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: "Hi" }],
      }),
    });
    expect(open.status).toBe(200);
  });
});
