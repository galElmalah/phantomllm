import { describe, it, expect } from "vitest";
import { MockLLM } from "../../src/driver/mock-llm.js";
import { computeStats, formatResult } from "./helpers.js";

describe("server lifecycle benchmarks", () => {
  it("measures cold start (MockLLM.start)", async () => {
    const mock = new MockLLM();

    const start = performance.now();
    await mock.start();
    const elapsed = performance.now() - start;

    console.log(`\n  cold start: ${elapsed.toFixed(0)}ms`);

    expect(elapsed).toBeLessThan(30_000);

    await mock.stop();
  }, 60_000);

  it("measures stop (MockLLM.stop)", async () => {
    const mock = new MockLLM();
    await mock.start();

    const start = performance.now();
    await mock.stop();
    const elapsed = performance.now() - start;

    console.log(`\n  stop: ${elapsed.toFixed(0)}ms`);

    expect(elapsed).toBeLessThan(10_000);
  }, 60_000);

  it("measures start/stop cycle 3 times", async () => {
    const samples: number[] = [];

    for (let i = 0; i < 3; i++) {
      const mock = new MockLLM();

      const start = performance.now();
      await mock.start();
      const elapsed = performance.now() - start;
      samples.push(elapsed);

      await mock.stop();
    }

    const result = computeStats("start/stop cycle", samples);
    console.log("\n" + formatResult(result));
  }, 120_000);

  it("measures full lifecycle: start → stub → request → stop", async () => {
    const mock = new MockLLM();

    const t0 = performance.now();
    await mock.start();
    const startTime = performance.now() - t0;

    const t1 = performance.now();
    mock.given.chatCompletion.willReturn("benchmarked");
    await mock.clear(); // flush triggers the stub registration
    const stubTime = performance.now() - t1;

    // re-register since clear wiped it
    mock.given.chatCompletion.willReturn("benchmarked");

    const t2 = performance.now();
    const res = await fetch(`${mock.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: "hi" }],
      }),
    });
    await res.json();
    const requestTime = performance.now() - t2;

    const t3 = performance.now();
    await mock.stop();
    const stopTime = performance.now() - t3;

    const totalTime = performance.now() - t0;

    console.log(`\n  full lifecycle breakdown`);
    console.log(`    start:     ${startTime.toFixed(0)}ms`);
    console.log(`    stub:      ${stubTime.toFixed(0)}ms`);
    console.log(`    request:   ${requestTime.toFixed(0)}ms`);
    console.log(`    stop:      ${stopTime.toFixed(0)}ms`);
    console.log(`    total:     ${totalTime.toFixed(0)}ms`);
  }, 60_000);
});
