import { describe, it, expect } from "vitest";
import { buildChunkSequence } from "../../src/server/streaming/chunk.builder.js";

const baseParams = {
  id: "chatcmpl-test123",
  model: "gpt-4",
  created: 1700000000,
  textChunks: ["Hello", " world"],
};

describe("buildChunkSequence", () => {
  it("first chunk has delta.role = 'assistant' and content = ''", () => {
    const chunks = buildChunkSequence(baseParams);
    const first = chunks[0]!;
    expect(first.choices[0]!.delta.role).toBe("assistant");
    expect(first.choices[0]!.delta.content).toBe("");
  });

  it("content chunks have correct text in delta.content", () => {
    const chunks = buildChunkSequence(baseParams);
    expect(chunks[1]!.choices[0]!.delta.content).toBe("Hello");
    expect(chunks[2]!.choices[0]!.delta.content).toBe(" world");
  });

  it("final chunk has finish_reason = 'stop' and empty delta", () => {
    const chunks = buildChunkSequence(baseParams);
    const last = chunks[chunks.length - 1]!;
    expect(last.choices[0]!.finish_reason).toBe("stop");
    expect(last.choices[0]!.delta).toEqual({});
  });

  it("all chunks share same id", () => {
    const chunks = buildChunkSequence(baseParams);
    for (const chunk of chunks) {
      expect(chunk.id).toBe("chatcmpl-test123");
    }
  });

  it("object is 'chat.completion.chunk' on all chunks", () => {
    const chunks = buildChunkSequence(baseParams);
    for (const chunk of chunks) {
      expect(chunk.object).toBe("chat.completion.chunk");
    }
  });

  it("usage chunk added when includeUsage = true", () => {
    const usage = { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 };
    const chunks = buildChunkSequence({ ...baseParams, includeUsage: true, usage });
    const last = chunks[chunks.length - 1]!;
    expect(last.choices).toHaveLength(0);
    expect(last.usage).toEqual(usage);
  });

  it("no usage chunk when includeUsage = false", () => {
    const usage = { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 };
    const chunks = buildChunkSequence({ ...baseParams, includeUsage: false, usage });
    // Without usage: first + 2 content + final = 4
    expect(chunks).toHaveLength(4);
    const last = chunks[chunks.length - 1]!;
    expect(last.choices[0]!.finish_reason).toBe("stop");
  });
});
