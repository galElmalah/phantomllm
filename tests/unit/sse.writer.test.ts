import { describe, it, expect, vi } from "vitest";
import { PassThrough } from "node:stream";
import {
  writeSSEHeaders,
  writeSSEData,
  writeSSEDone,
  streamChunks,
} from "../../src/server/streaming/sse.writer.js";
import type { ServerResponse } from "node:http";
import type { ChatCompletionChunk } from "../../src/types/openai.js";

function createMockResponse() {
  const stream = new PassThrough();
  const chunks: Buffer[] = [];
  stream.on("data", (chunk: Buffer) => chunks.push(chunk));

  const raw = {
    writeHead: vi.fn(),
    write: vi.fn((data: string) => {
      stream.write(data);
      return true;
    }),
    end: vi.fn(() => stream.end()),
  };

  return { raw: raw as unknown as ServerResponse, chunks, getOutput: () => Buffer.concat(chunks).toString() };
}

describe("writeSSEHeaders", () => {
  it("calls writeHead with correct content-type", () => {
    const { raw } = createMockResponse();
    writeSSEHeaders(raw);
    expect(raw.writeHead).toHaveBeenCalledWith(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
  });
});

describe("writeSSEData", () => {
  it("writes data: {...}\\n\\n format", () => {
    const { raw, getOutput } = createMockResponse();
    const data = { id: "test", content: "hello" };
    writeSSEData(raw, data);
    expect(raw.write).toHaveBeenCalledWith(`data: ${JSON.stringify(data)}\n\n`);
  });
});

describe("writeSSEDone", () => {
  it("writes data: [DONE]\\n\\n and calls end", () => {
    const { raw } = createMockResponse();
    writeSSEDone(raw);
    expect(raw.write).toHaveBeenCalledWith("data: [DONE]\n\n");
    expect(raw.end).toHaveBeenCalled();
  });
});

describe("streamChunks", () => {
  it("writes all chunks with [DONE] terminator", async () => {
    const { raw } = createMockResponse();
    const ac = new AbortController();
    const chunk: ChatCompletionChunk = {
      id: "chatcmpl-test",
      object: "chat.completion.chunk",
      created: 1700000000,
      model: "gpt-4",
      system_fingerprint: "fp_mock",
      choices: [{ index: 0, delta: { content: "hi" }, finish_reason: null, logprobs: null }],
    };

    await streamChunks({ raw, chunks: [chunk, chunk], signal: ac.signal });

    // writeHead for headers + 2 data writes + 1 DONE write
    expect(raw.writeHead).toHaveBeenCalledTimes(1);
    // 2 data chunks + 1 DONE
    expect(raw.write).toHaveBeenCalledTimes(3);
    expect(raw.end).toHaveBeenCalled();
  });
});
