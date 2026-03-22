import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
import { MockLLM } from "../../src/index.js";
import OpenAI from "openai";

const mock = new MockLLM();
let client: OpenAI;

beforeAll(async () => {
  await mock.start();
  client = new OpenAI({ baseURL: mock.apiBaseUrl, apiKey: "test-key" });
});

afterAll(async () => {
  await mock.stop();
});

beforeEach(() => {
  mock.clear();
});

describe("OpenAI SDK - embeddings", () => {
  it("creates embeddings with OpenAI SDK", async () => {
    const vector = [0.1, 0.2, 0.3, 0.4, 0.5];
    mock.given.embedding
      .forModel("text-embedding-3-small")
      .willReturn(vector);

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
