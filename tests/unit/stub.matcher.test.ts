import { describe, it, expect } from "vitest";
import {
  matchModel,
  matchContent,
  matchInput,
  stubMatches,
  specificity,
} from "../../src/server/stubs/stub.matcher.js";
import type { StubMatcher, StubEntry } from "../../src/server/stubs/stub.types.js";

function makeEntry(matcher: StubMatcher): StubEntry {
  return {
    id: "test-id",
    createdAt: Date.now(),
    matcher,
    response: { type: "chat", body: "hello" },
    delay: 0,
    callCount: 0,
  };
}

describe("matchModel", () => {
  it("returns true when no model constraint", () => {
    expect(matchModel({}, "gpt-4")).toBe(true);
  });

  it("returns true on exact match", () => {
    expect(matchModel({ model: "gpt-4" }, "gpt-4")).toBe(true);
  });

  it("returns false on non-match", () => {
    expect(matchModel({ model: "gpt-4" }, "gpt-3.5")).toBe(false);
  });
});

describe("matchContent", () => {
  it("returns true when no content constraint", () => {
    expect(matchContent({}, [{ role: "user", content: "anything" }])).toBe(true);
  });

  it("finds substring in user messages (case-insensitive)", () => {
    const matcher: StubMatcher = { content: "hello" };
    const messages = [{ role: "user", content: "Say HELLO world" }];
    expect(matchContent(matcher, messages)).toBe(true);
  });

  it("returns false when no match", () => {
    const matcher: StubMatcher = { content: "goodbye" };
    const messages = [{ role: "user", content: "hello world" }];
    expect(matchContent(matcher, messages)).toBe(false);
  });

  it("skips non-user messages", () => {
    const matcher: StubMatcher = { content: "hello" };
    const messages = [
      { role: "system", content: "hello there" },
      { role: "assistant", content: "hello again" },
    ];
    expect(matchContent(matcher, messages)).toBe(false);
  });
});

describe("matchInput", () => {
  it("returns true when no input constraint", () => {
    expect(matchInput({}, "anything")).toBe(true);
  });

  it("finds substring in string input", () => {
    expect(matchInput({ input: "test" }, "this is a test string")).toBe(true);
  });

  it("finds substring in string[] input", () => {
    expect(matchInput({ input: "needle" }, ["haystack", "has a needle"])).toBe(true);
  });
});

describe("stubMatches", () => {
  it("matches catch-all (empty matcher)", () => {
    const entry = makeEntry({});
    expect(stubMatches(entry, "chat", "gpt-4", [{ role: "user", content: "hi" }])).toBe(true);
  });

  it("respects endpoint filter", () => {
    const entry = makeEntry({ endpoint: "embeddings" });
    expect(stubMatches(entry, "chat", "gpt-4")).toBe(false);
    expect(stubMatches(entry, "embeddings", "gpt-4")).toBe(true);
  });

  it("combines model + content matching", () => {
    const entry = makeEntry({ model: "gpt-4", content: "hello" });
    expect(
      stubMatches(entry, "chat", "gpt-4", [{ role: "user", content: "hello world" }]),
    ).toBe(true);
    expect(
      stubMatches(entry, "chat", "gpt-3.5", [{ role: "user", content: "hello world" }]),
    ).toBe(false);
    expect(
      stubMatches(entry, "chat", "gpt-4", [{ role: "user", content: "goodbye" }]),
    ).toBe(false);
  });
});

describe("specificity", () => {
  it("empty matcher = 0", () => {
    expect(specificity({})).toBe(0);
  });

  it("model only = 1", () => {
    expect(specificity({ model: "gpt-4" })).toBe(1);
  });

  it("model + content = 2", () => {
    expect(specificity({ model: "gpt-4", content: "hi" })).toBe(2);
  });
});
