import { describe, it, expect } from "vitest";
import { StubRegistry } from "../../src/server/stubs/stub.registry.js";
import { computeStats, formatResult } from "./helpers.js";

describe("stub matching benchmarks", () => {
  it("measures findMatch with 1 stub", () => {
    const registry = new StubRegistry();
    registry.register(
      { endpoint: "chat", model: "gpt-4" },
      { type: "chat", body: "Hello" },
    );

    const samples: number[] = [];
    const iterations = 10_000;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      registry.findMatch("chat", "gpt-4", [
        { role: "user", content: "Hi" },
      ]);
      const elapsed = performance.now() - start;
      samples.push(elapsed);
    }

    const result = computeStats("findMatch (1 stub)", samples);
    console.log("\n" + formatResult(result));

    expect(result.median).toBeLessThan(0.1);
  });

  it("measures findMatch with 100 stubs", () => {
    const registry = new StubRegistry();

    for (let i = 0; i < 100; i++) {
      registry.register(
        { endpoint: "chat", model: `model-${i}`, content: `content-${i}` },
        { type: "chat", body: `Response ${i}` },
      );
    }

    const samples: number[] = [];
    const iterations = 10_000;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      registry.findMatch("chat", "model-50", [
        { role: "user", content: "content-50" },
      ]);
      const elapsed = performance.now() - start;
      samples.push(elapsed);
    }

    const result = computeStats("findMatch (100 stubs)", samples);
    console.log("\n" + formatResult(result));

    expect(result.median).toBeLessThan(0.5);
  });

  it("measures findMatch with catch-all among many specific stubs", () => {
    const registry = new StubRegistry();

    // Register catch-all first
    registry.register({}, { type: "chat", body: "Catch all" });

    // Then many specific stubs
    for (let i = 0; i < 100; i++) {
      registry.register(
        { endpoint: "chat", model: `specific-model-${i}` },
        { type: "chat", body: `Specific ${i}` },
      );
    }

    const samples: number[] = [];
    const iterations = 10_000;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      registry.findMatch("chat", "unknown-model", [
        { role: "user", content: "anything" },
      ]);
      const elapsed = performance.now() - start;
      samples.push(elapsed);
    }

    const result = computeStats("findMatch (catch-all among 101 stubs)", samples);
    console.log("\n" + formatResult(result));

    expect(result.median).toBeLessThan(0.5);
  });

  it("measures register + clear cycle", () => {
    const registry = new StubRegistry();

    const samples: number[] = [];
    const iterations = 1_000;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      for (let j = 0; j < 10; j++) {
        registry.register(
          { endpoint: "chat", model: `model-${j}` },
          { type: "chat", body: `Response ${j}` },
        );
      }
      registry.clear();
      const elapsed = performance.now() - start;
      samples.push(elapsed);
    }

    const result = computeStats("register 10 + clear cycle", samples);
    console.log("\n" + formatResult(result));

    expect(result.median).toBeLessThan(0.5);
  });
});
