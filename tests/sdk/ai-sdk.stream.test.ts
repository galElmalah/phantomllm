import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
import { MockLLM } from "../../src/index.js";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

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

describe("Vercel AI SDK - streamText", () => {
  it("streams text with AI SDK", async () => {
    mock.given.chatCompletion.willStream(["Hello", " ", "from", " ", "stream"]);

    const provider = createOpenAI({
      baseURL: mock.apiBaseUrl,
      apiKey: "test-key",
    });

    const result = streamText({
      model: provider.chat("gpt-4"),
      prompt: "Say hello",
    });

    const collectedParts: string[] = [];
    for await (const textPart of result.textStream) {
      collectedParts.push(textPart);
    }

    const fullText = collectedParts.join("");
    expect(fullText).toBe("Hello from stream");
  });
});
