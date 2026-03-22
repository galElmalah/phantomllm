import { describe, it, expect } from "vitest";
import { estimateTokens, estimatePromptTokens } from "../../src/server/utils/token.counter.js";

describe("estimateTokens", () => {
  it("returns min 1", () => {
    expect(estimateTokens("")).toBe(1);
  });

  it("~chars/4 for normal text", () => {
    const text = "hello world test"; // 16 chars -> ceil(16/4) = 4
    expect(estimateTokens(text)).toBe(4);
  });

  it("empty string returns 1 (minimum)", () => {
    expect(estimateTokens("")).toBe(1);
  });
});

describe("estimatePromptTokens", () => {
  it("adds per-message overhead", () => {
    const single = estimatePromptTokens([{ role: "user", content: "hi" }]);
    const double = estimatePromptTokens([
      { role: "user", content: "hi" },
      { role: "assistant", content: "hi" },
    ]);
    // Each message adds 4 tokens overhead, so double should be > single
    expect(double).toBeGreaterThan(single);
    // Difference should be 4 (per-message) + estimateTokens("hi") = 4 + 1 = 5
    expect(double - single).toBe(5);
  });

  it("adds framing overhead", () => {
    // With no messages, should still have framing overhead of 2
    const tokens = estimatePromptTokens([]);
    expect(tokens).toBe(2);
  });
});
