import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
import { MockLLM } from "../../src/index.js";
import { createOpenAI } from "@ai-sdk/openai";
import { embed } from "ai";

const mock = new MockLLM();

beforeAll(async () => {
  await mock.start();
});

afterAll(async () => {
  await mock.stop();
});

beforeEach(() => {
  mock.clear();
});

describe("Vercel AI SDK - embed", () => {
  it("creates embeddings with AI SDK", async () => {
    const vector = [0.1, 0.2, 0.3, 0.4, 0.5];
    mock.given.embedding
      .forModel("text-embedding-3-small")
      .willReturn(vector);

    const provider = createOpenAI({
      baseURL: mock.apiBaseUrl,
      apiKey: "test-key",
    });

    const result = await embed({
      model: provider.embedding("text-embedding-3-small"),
      value: "Hello world",
    });

    expect(result.embedding).toEqual(vector);
  });
});
