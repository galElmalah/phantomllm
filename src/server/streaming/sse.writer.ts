import type { ServerResponse } from "node:http";
import type { ChatCompletionChunk } from "../../types/openai.js";

async function sleep(ms: number, signal: AbortSignal): Promise<void> {
  if (ms <= 0) return;
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

export function writeSSEHeaders(raw: ServerResponse): void {
  raw.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
}

export function writeSSEData(raw: ServerResponse, data: object): void {
  raw.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function writeSSEDone(raw: ServerResponse): void {
  raw.write("data: [DONE]\n\n");
  raw.end();
}

export async function streamChunks(params: {
  raw: ServerResponse;
  chunks: ChatCompletionChunk[];
  delayMs?: number;
  signal: AbortSignal;
}): Promise<void> {
  const { raw, chunks, delayMs, signal } = params;

  writeSSEHeaders(raw);

  for (const chunk of chunks) {
    if (signal.aborted) break;

    writeSSEData(raw, chunk);

    if (delayMs !== undefined && delayMs > 0) {
      await sleep(delayMs, signal);
    }
  }

  if (!signal.aborted) {
    writeSSEDone(raw);
  }
}
