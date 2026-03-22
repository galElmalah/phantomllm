import { describe, it, expect } from "vitest";
import { buildChatCompletion } from "../../src/server/responses/chat.response.js";

describe("buildChatCompletion", () => {
  const result = buildChatCompletion("Hello world", "gpt-4", [
    { role: "user", content: "Hi" },
  ]);

  it("returns object with object: 'chat.completion'", () => {
    expect(result.object).toBe("chat.completion");
  });

  it("has id starting with 'chatcmpl-'", () => {
    expect(result.id).toMatch(/^chatcmpl-/);
  });

  it("has choices[0].message.content matching input", () => {
    expect(result.choices[0]!.message.content).toBe("Hello world");
  });

  it("has choices[0].message.role as 'assistant'", () => {
    expect(result.choices[0]!.message.role).toBe("assistant");
  });

  it("has choices[0].finish_reason as 'stop'", () => {
    expect(result.choices[0]!.finish_reason).toBe("stop");
  });

  it("has usage with token counts > 0", () => {
    expect(result.usage.prompt_tokens).toBeGreaterThan(0);
    expect(result.usage.completion_tokens).toBeGreaterThan(0);
    expect(result.usage.total_tokens).toBeGreaterThan(0);
  });

  it("has system_fingerprint", () => {
    expect(result.system_fingerprint).toBeDefined();
    expect(typeof result.system_fingerprint).toBe("string");
  });
});
