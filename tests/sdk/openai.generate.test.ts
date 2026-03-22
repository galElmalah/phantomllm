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

describe("OpenAI SDK - chat completions", () => {
  it("generates text with OpenAI SDK", async () => {
    mock.given.chatCompletion.willReturn("Hello from mock server!");

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
    mock.given.chatCompletion.willError(429, "Rate limit exceeded");

    await expect(
      client.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: "Hi" }],
      }),
    ).rejects.toThrow();
  });
});
