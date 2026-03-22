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

describe("embedding benchmarks (docker)", () => {
  it("measures embedding response latency", async () => {
    const vector = Array.from({ length: 1536 }, (_, i) => i * 0.001);

    await fetch(`${baseUrl}/_admin/stubs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matcher: { endpoint: "embeddings" },
        response: { type: "embedding", vectors: [vector] },
      }),
    });

    // warmup
    for (let i = 0; i < 5; i++) {
      await fetch(`${baseUrl}/v1/embeddings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: "test input",
        }),
      });
    }

    const samples: number[] = [];
    const iterations = 100;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      const res = await fetch(`${baseUrl}/v1/embeddings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: "test input",
        }),
      });
      await res.json();
      const elapsed = performance.now() - start;
      samples.push(elapsed);
    }

    await mock.clear();

    const result = computeStats("embedding via docker (1536-dim)", samples);
    console.log("\n" + formatResult(result));

    expect(result.median).toBeLessThan(50);
  });

  it("measures large batch embedding latency", async () => {
    const vectors = Array.from({ length: 10 }, () =>
      Array.from({ length: 1536 }, (_, i) => i * 0.001),
    );

    await fetch(`${baseUrl}/_admin/stubs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matcher: { endpoint: "embeddings" },
        response: { type: "embedding", vectors },
      }),
    });

    const samples: number[] = [];
    const iterations = 50;

    for (let i = 0; i < iterations; i++) {
      const inputs = Array.from({ length: 10 }, (_, j) => `test input ${j}`);
      const start = performance.now();
      const res = await fetch(`${baseUrl}/v1/embeddings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: inputs,
        }),
      });
      await res.json();
      const elapsed = performance.now() - start;
      samples.push(elapsed);
    }

    await mock.clear();

    const result = computeStats("embedding batch via docker (10x1536-dim)", samples);
    console.log("\n" + formatResult(result));

    expect(result.median).toBeLessThan(100);
  });
});
