import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { MockLLM } from "../../src/driver/mock-llm.js";

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

describe("throughput benchmarks (docker)", () => {
  it("measures sequential chat requests per second", async () => {
    await fetch(`${baseUrl}/_admin/stubs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matcher: { endpoint: "chat" },
        response: { type: "chat", body: "Quick response" },
      }),
    });

    const body = JSON.stringify({
      model: "gpt-4",
      messages: [{ role: "user", content: "Hi" }],
    });

    // warmup
    for (let i = 0; i < 10; i++) {
      const r = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      await r.json();
    }

    const durationMs = 3_000;
    let count = 0;
    const start = performance.now();

    while (performance.now() - start < durationMs) {
      const res = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      await res.json();
      count++;
    }

    const elapsed = performance.now() - start;
    const rps = (count / elapsed) * 1000;

    await mock.clear();

    console.log(`\n  sequential chat throughput (docker)`);
    console.log(`    requests:  ${count}`);
    console.log(`    duration:  ${elapsed.toFixed(0)}ms`);
    console.log(`    rps:       ${rps.toFixed(1)} req/s`);

    expect(rps).toBeGreaterThan(50);
  });

  it("measures concurrent chat requests per second", async () => {
    await fetch(`${baseUrl}/_admin/stubs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matcher: { endpoint: "chat" },
        response: { type: "chat", body: "Quick response" },
      }),
    });

    const concurrency = 10;
    const totalRequests = 500;
    const body = JSON.stringify({
      model: "gpt-4",
      messages: [{ role: "user", content: "Hi" }],
    });

    // warmup
    for (let i = 0; i < 10; i++) {
      const r = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      await r.json();
    }

    const start = performance.now();
    let completed = 0;
    let inflight = 0;
    let launched = 0;

    await new Promise<void>((resolve) => {
      function launch(): void {
        while (inflight < concurrency && launched < totalRequests) {
          inflight++;
          launched++;
          fetch(`${baseUrl}/v1/chat/completions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
          })
            .then((r) => r.json())
            .then(() => {
              completed++;
              inflight--;
              if (completed >= totalRequests) {
                resolve();
              } else {
                launch();
              }
            });
        }
      }
      launch();
    });

    const elapsed = performance.now() - start;
    const rps = (completed / elapsed) * 1000;

    await mock.clear();

    console.log(`\n  concurrent chat throughput (docker, concurrency=${concurrency})`);
    console.log(`    requests:  ${completed}`);
    console.log(`    duration:  ${elapsed.toFixed(0)}ms`);
    console.log(`    rps:       ${rps.toFixed(1)} req/s`);

    expect(rps).toBeGreaterThan(100);
  });

  it("measures health endpoint throughput via docker", async () => {
    // warmup
    for (let i = 0; i < 10; i++) {
      await fetch(`${baseUrl}/_admin/health`);
    }

    const durationMs = 2_000;
    let count = 0;
    const start = performance.now();

    while (performance.now() - start < durationMs) {
      const res = await fetch(`${baseUrl}/_admin/health`);
      await res.json();
      count++;
    }

    const elapsed = performance.now() - start;
    const rps = (count / elapsed) * 1000;

    console.log(`\n  health endpoint throughput (docker)`);
    console.log(`    requests:  ${count}`);
    console.log(`    duration:  ${elapsed.toFixed(0)}ms`);
    console.log(`    rps:       ${rps.toFixed(1)} req/s`);

    expect(rps).toBeGreaterThan(100);
  });
});
