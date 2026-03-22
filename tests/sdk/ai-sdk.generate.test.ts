import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
import { MockLLM } from "../../src/index.js";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

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

describe("Vercel AI SDK - generateText", () => {
  it("generates text with AI SDK", async () => {
    mock.given.chatCompletion.willReturn("AI SDK response");

    const provider = createOpenAI({
      baseURL: mock.apiBaseUrl,
      apiKey: "test-key",
    });

    const result = await generateText({
      model: provider.chat("gpt-4"),
      prompt: "Say hello",
    });

    expect(result.text).toBe("AI SDK response");
  });
});
