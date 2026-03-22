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

describe("OpenAI SDK - streaming", () => {
  it("streams text with OpenAI SDK", async () => {
    mock.given.chatCompletion.willStream(["Hello", " ", "world", "!"]);

    const stream = await client.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: "Hi" }],
      stream: true,
    });

    const collectedContent: string[] = [];
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        collectedContent.push(content);
      }
    }

    expect(collectedContent).toEqual(["Hello", " ", "world", "!"]);
    expect(collectedContent.join("")).toBe("Hello world!");
  });
});
