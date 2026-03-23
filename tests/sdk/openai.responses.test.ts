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

describe("OpenAI SDK - responses API", () => {
  it("creates a response with string input", async () => {
    mock.given.chatCompletion.willReturn("Hello from responses!");

    const response = await client.responses.create({
      model: "gpt-4o",
      input: "Say hello",
    });

    expect(response.id).toMatch(/^resp_/);
    expect(response.object).toBe("response");
    expect(response.status).toBe("completed");
    expect(response.output_text).toBe("Hello from responses!");
  });

  it("creates a response with array input", async () => {
    mock.given.chatCompletion.willReturn("Array input works!");

    const response = await client.responses.create({
      model: "gpt-4o",
      input: [{ role: "user", content: "Hello" }],
    });

    expect(response.output_text).toBe("Array input works!");
  });

  it("creates a response using given.response builder", async () => {
    mock.given.response
      .forModel("gpt-4o")
      .willReturn("Response builder works!");

    const response = await client.responses.create({
      model: "gpt-4o",
      input: "Hi",
    });

    expect(response.output_text).toBe("Response builder works!");
  });

  it("matches stubs with withInputContaining", async () => {
    mock.given.response
      .withInputContaining("weather")
      .willReturn("Sunny, 72F.");

    const response = await client.responses.create({
      model: "gpt-4o",
      input: "What's the weather?",
    });

    expect(response.output_text).toBe("Sunny, 72F.");
  });

  it("streams a response", async () => {
    mock.given.chatCompletion.willStream(["Hello", " ", "world"]);

    const stream = await client.responses.create({
      model: "gpt-4o",
      input: "Hi",
      stream: true,
    });

    const chunks: string[] = [];
    for await (const event of stream) {
      if (event.type === "response.output_text.delta") {
        chunks.push(event.delta);
      }
    }

    expect(chunks).toEqual(["Hello", " ", "world"]);
  });

  it("handles error responses", async () => {
    mock.given.chatCompletion.willError(429, "Rate limit exceeded");

    await expect(
      client.responses.create({
        model: "gpt-4o",
        input: "Hi",
      }),
    ).rejects.toThrow();
  });

  it("shares stubs between chat completions and responses", async () => {
    mock.given.chatCompletion
      .forModel("gpt-4o")
      .willReturn("Shared response");

    // Works via responses API
    const response = await client.responses.create({
      model: "gpt-4o",
      input: "Hi",
    });
    expect(response.output_text).toBe("Shared response");

    // Same stub works via chat completions
    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: "Hi" }],
    });
    expect(completion.choices[0]?.message.content).toBe("Shared response");
  });
});
