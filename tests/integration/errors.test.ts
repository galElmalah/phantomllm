import { describe, it, expect } from "vitest";
import { getApp } from "../fixtures/setup.js";
import { registerErrorStub } from "../fixtures/stubs.js";

describe("error responses", () => {
  it("returns a stubbed error response", async () => {
    const app = getApp();
    await registerErrorStub(app, 429, "Rate limit exceeded");

    const res = await app.inject({
      method: "POST",
      url: "/v1/chat/completions",
      payload: {
        model: "gpt-4",
        messages: [{ role: "user", content: "Hi" }],
      },
    });

    expect(res.statusCode).toBe(429);
    const body = res.json();
    expect(body.error).toBeDefined();
    expect(body.error.message).toBe("Rate limit exceeded");
    expect(body.error.type).toBe("api_error");
  });

  it("returns 418 with request details when no stub matches", async () => {
    const app = getApp();

    const res = await app.inject({
      method: "POST",
      url: "/v1/chat/completions",
      payload: {
        model: "gpt-4o",
        messages: [{ role: "user", content: "test message" }],
      },
    });

    expect(res.statusCode).toBe(418);
    const body = res.json();
    expect(body.error.message).toContain("gpt-4o");
    expect(body.error.type).toBe("stub_not_found");
  });
});
