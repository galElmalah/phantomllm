import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { MockLLM } from "../../src/driver/mock-llm.js";
import { computeStats, formatResult } from "./helpers.js";

let mock: MockLLM;
let baseUrl: string;

beforeAll(async () => {
  mock = new MockLLM();
  await mock.start();
  baseUrl = mock.baseUrl;
}, 60_000);

afterAll(async () => {
  await mock.stop();
});

describe("chat completion benchmarks ", () => {
  it("measures non-streaming response latency", async () => {
    mock.given.chatCompletion.willReturn("Hello from the mock!");

    // flush stubs
    await fetch(`${baseUrl}/_admin/health`);
    // wait briefly for stub registration
    await new Promise((r) => setTimeout(r, 50));

    // warmup
    for (let i = 0; i < 5; i++) {
      await fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [{ role: "user", content: "Hi" }],
        }),
      });
    }

    const samples: number[] = [];
    const iterations = 100;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      const res = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [{ role: "user", content: "Hi" }],
        }),
      });
      await res.json();
      const elapsed = performance.now() - start;
      samples.push(elapsed);
    }

    await mock.clear();

    const result = computeStats("chat completion  (non-streaming)", samples);
    console.log("\n" + formatResult(result));

    expect(result.median).toBeLessThan(50);
  });

  it("measures streaming response latency (time to first byte)", async () => {
    mock.given.chatCompletion.willStream([
      "Hello",
      " ",
      "world",
      "!",
      " How",
      " are",
      " you",
      "?",
    ]);

    await new Promise((r) => setTimeout(r, 50));

    // warmup
    for (let i = 0; i < 3; i++) {
      const r = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [{ role: "user", content: "Hi" }],
          stream: true,
        }),
      });
      await r.text();
    }

    const ttfbSamples: number[] = [];
    const totalSamples: number[] = [];
    const iterations = 50;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      const res = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [{ role: "user", content: "Hi" }],
          stream: true,
        }),
      });

      const ttfb = performance.now() - start;
      ttfbSamples.push(ttfb);

      await res.text();
      const total = performance.now() - start;
      totalSamples.push(total);
    }

    await mock.clear();

    const ttfbResult = computeStats("docker stream TTFB", ttfbSamples);
    const totalResult = computeStats("docker stream total (8 chunks + DONE)", totalSamples);
    console.log("\n" + formatResult(ttfbResult));
    console.log("\n" + formatResult(totalResult));

    expect(ttfbResult.median).toBeLessThan(50);
  });

  it("measures stub registration latency via admin API", async () => {
    const samples: number[] = [];
    const iterations = 100;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fetch(`${baseUrl}/_admin/stubs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matcher: { endpoint: "chat", model: `model-${i}` },
          response: { type: "chat", body: `Response ${i}` },
        }),
      });
      const elapsed = performance.now() - start;
      samples.push(elapsed);
    }

    await mock.clear();

    const result = computeStats("stub registration ", samples);
    console.log("\n" + formatResult(result));

    expect(result.median).toBeLessThan(20);
  });

  it("measures clear stubs latency via admin API", async () => {
    const samples: number[] = [];
    const iterations = 20;

    for (let i = 0; i < iterations; i++) {
      // register 50 stubs
      for (let j = 0; j < 50; j++) {
        await fetch(`${baseUrl}/_admin/stubs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            matcher: { endpoint: "chat", model: `model-${j}` },
            response: { type: "chat", body: `Response ${j}` },
          }),
        });
      }

      const start = performance.now();
      await fetch(`${baseUrl}/_admin/stubs`, { method: "DELETE" });
      const elapsed = performance.now() - start;
      samples.push(elapsed);
    }

    const result = computeStats("clear 50 stubs ", samples);
    console.log("\n" + formatResult(result));

    expect(result.median).toBeLessThan(20);
  });
});
