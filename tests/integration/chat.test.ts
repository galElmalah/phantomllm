import { describe, it, expect } from "vitest";
import { getApp } from "../fixtures/setup.js";
import { registerChatStub } from "../fixtures/stubs.js";

describe("chat completions", () => {
  it("returns a stubbed chat completion", async () => {
    const app = getApp();
    await registerChatStub(app, "Hello from mock!");

    const res = await app.inject({
      method: "POST",
      url: "/v1/chat/completions",
      payload: {
        model: "gpt-4",
        messages: [{ role: "user", content: "Hi" }],
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.object).toBe("chat.completion");
    expect(body.choices).toHaveLength(1);
    expect(body.choices[0].message.role).toBe("assistant");
    expect(body.choices[0].message.content).toBe("Hello from mock!");
    expect(body.choices[0].finish_reason).toBe("stop");
  });

  it("returns 418 when no stub matches", async () => {
    const app = getApp();

    const res = await app.inject({
      method: "POST",
      url: "/v1/chat/completions",
      payload: {
        model: "gpt-4",
        messages: [{ role: "user", content: "Hi" }],
      },
    });

    expect(res.statusCode).toBe(418);
    const body = res.json();
    expect(body.error).toBeDefined();
    expect(body.error.type).toBe("stub_not_found");
  });

  it("returns correct model in response", async () => {
    const app = getApp();
    await registerChatStub(app, "Model response", "gpt-3.5-turbo");

    const res = await app.inject({
      method: "POST",
      url: "/v1/chat/completions",
      payload: {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Hi" }],
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.model).toBe("gpt-3.5-turbo");
  });

  it("includes usage information", async () => {
    const app = getApp();
    await registerChatStub(app, "Some response text");

    const res = await app.inject({
      method: "POST",
      url: "/v1/chat/completions",
      payload: {
        model: "gpt-4",
        messages: [{ role: "user", content: "Hello there" }],
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.usage).toBeDefined();
    expect(typeof body.usage.prompt_tokens).toBe("number");
    expect(typeof body.usage.completion_tokens).toBe("number");
    expect(typeof body.usage.total_tokens).toBe("number");
    expect(body.usage.total_tokens).toBe(
      body.usage.prompt_tokens + body.usage.completion_tokens,
    );
  });
});
