import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { MockLLM } from "../../src/index.js";
import OpenAI from "openai";

describe("MockLLM end-to-end (given → SDK → assert)", () => {
  const mock = new MockLLM();
  let client: OpenAI;

  beforeAll(async () => {
    await mock.start();
    client = new OpenAI({ baseURL: mock.apiBaseUrl, apiKey: "test" });
  });

  afterAll(async () => {
    await mock.stop();
  });

  beforeEach(() => {
    mock.clear();
  });

  it("returns stubbed chat completion", async () => {
    mock.given.chatCompletion.willReturn("Hello from mock!");

    const res = await client.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: "Hi" }],
    });

    expect(res.choices[0]?.message.content).toBe("Hello from mock!");
  });

  it("matches by model", async () => {
    mock.given.chatCompletion.forModel("gpt-4").willReturn("I am GPT-4");
    mock.given.chatCompletion.forModel("gpt-3.5-turbo").willReturn("I am 3.5");

    const res4 = await client.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: "Who?" }],
    });
    expect(res4.choices[0]?.message.content).toBe("I am GPT-4");

    const res35 = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Who?" }],
    });
    expect(res35.choices[0]?.message.content).toBe("I am 3.5");
  });

  it("matches by message content", async () => {
    mock.given.chatCompletion
      .withMessageContaining("weather")
      .willReturn("Sunny!");

    mock.given.chatCompletion.willReturn("Default");

    const weather = await client.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: "What is the weather?" }],
    });
    expect(weather.choices[0]?.message.content).toBe("Sunny!");

    const other = await client.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: "Hello" }],
    });
    expect(other.choices[0]?.message.content).toBe("Default");
  });

  it("streams stubbed response", async () => {
    mock.given.chatCompletion.willStream(["Hello", " ", "World"]);

    const stream = await client.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: "Hi" }],
      stream: true,
    });

    const chunks: string[] = [];
    for await (const chunk of stream) {
      const c = chunk.choices[0]?.delta?.content;
      if (c) chunks.push(c);
    }
    expect(chunks).toEqual(["Hello", " ", "World"]);
  });

  it("returns stubbed error", async () => {
    mock.given.chatCompletion.willError(429, "Rate limit exceeded");

    await expect(
      client.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: "Hi" }],
      }),
    ).rejects.toThrow();
  });

  it("returns stubbed embedding", async () => {
    mock.given.embedding
      .forModel("text-embedding-3-small")
      .willReturn([0.1, 0.2, 0.3]);

    const res = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: "test",
      encoding_format: "float",
    });

    expect(res.data[0]?.embedding).toEqual([0.1, 0.2, 0.3]);
  });

  it("validates api key via expect", async () => {
    mock.expect.apiKey("secret-123");
    mock.given.chatCompletion.willReturn("Authed");

    const badClient = new OpenAI({
      baseURL: mock.apiBaseUrl,
      apiKey: "wrong",
    });

    await expect(
      badClient.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: "Hi" }],
      }),
    ).rejects.toThrow();

    const goodClient = new OpenAI({
      baseURL: mock.apiBaseUrl,
      apiKey: "secret-123",
    });

    const res = await goodClient.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: "Hi" }],
    });
    expect(res.choices[0]?.message.content).toBe("Authed");
  });

  it("clear resets stubs and auth", async () => {
    mock.expect.apiKey("key");
    mock.given.chatCompletion.willReturn("Before clear");

    mock.clear();

    mock.given.chatCompletion.willReturn("After clear");

    const res = await client.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: "Hi" }],
    });
    expect(res.choices[0]?.message.content).toBe("After clear");
  });
});
