import { describe, it, expect } from "vitest";
import { getApp } from "../fixtures/setup.js";
import { registerChatStub } from "../fixtures/stubs.js";

describe("stub management", () => {
  it("registers and lists stubs via health endpoint", async () => {
    const app = getApp();
    await registerChatStub(app, "response-1");
    await registerChatStub(app, "response-2");

    const res = await app.inject({
      method: "GET",
      url: "/_admin/health",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.stubCount).toBe(2);
  });

  it("clears all stubs", async () => {
    const app = getApp();
    await registerChatStub(app, "response-1");
    await registerChatStub(app, "response-2");

    const clearRes = await app.inject({
      method: "DELETE",
      url: "/_admin/stubs",
    });
    expect(clearRes.statusCode).toBe(200);
    const clearBody = clearRes.json();
    expect(clearBody.cleared).toBe(2);

    const healthRes = await app.inject({
      method: "GET",
      url: "/_admin/health",
    });
    const healthBody = healthRes.json();
    expect(healthBody.stubCount).toBe(0);
  });

  it("health endpoint returns status ok", async () => {
    const app = getApp();

    const res = await app.inject({
      method: "GET",
      url: "/_admin/health",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe("ok");
    expect(typeof body.uptime).toBe("number");
  });
});
