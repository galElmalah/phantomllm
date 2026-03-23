import { describe, it, expect } from "vitest";
import { getApp } from "../fixtures/setup.js";
import { registerChatStub } from "../fixtures/stubs.js";

describe("responses API", () => {
  it("returns a response object for string input", async () => {
    const app = getApp();
    await registerChatStub(app, "Hello from responses!");

    const res = await app.inject({
      method: "POST",
      url: "/v1/responses",
      payload: {
        model: "gpt-4o",
        input: "Hi there",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.object).toBe("response");
    expect(body.id).toMatch(/^resp_/);
    expect(body.status).toBe("completed");
    expect(body.model).toBe("gpt-4o");
    expect(body.output).toHaveLength(1);
    expect(body.output[0].type).toBe("message");
    expect(body.output[0].role).toBe("assistant");
    expect(body.output[0].id).toMatch(/^msg_/);
    expect(body.output[0].content[0].type).toBe("output_text");
    expect(body.output[0].content[0].text).toBe("Hello from responses!");
    expect(body.output_text).toBe("Hello from responses!");
  });

  it("returns a response object for array input", async () => {
    const app = getApp();
    await registerChatStub(app, "Array input works!");

    const res = await app.inject({
      method: "POST",
      url: "/v1/responses",
      payload: {
        model: "gpt-4o",
        input: [
          { role: "user", content: "Hello" },
        ],
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.object).toBe("response");
    expect(body.output_text).toBe("Array input works!");
  });

  it("returns 418 when no stub matches", async () => {
    const app = getApp();

    const res = await app.inject({
      method: "POST",
      url: "/v1/responses",
      payload: {
        model: "gpt-4o",
        input: "Hi",
      },
    });

    expect(res.statusCode).toBe(418);
    const body = res.json();
    expect(body.error).toBeDefined();
    expect(body.error.type).toBe("stub_not_found");
  });

  it("includes usage information", async () => {
    const app = getApp();
    await registerChatStub(app, "Some response text");

    const res = await app.inject({
      method: "POST",
      url: "/v1/responses",
      payload: {
        model: "gpt-4o",
        input: "Hello there",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.usage).toBeDefined();
    expect(typeof body.usage.input_tokens).toBe("number");
    expect(typeof body.usage.output_tokens).toBe("number");
    expect(body.usage.total_tokens).toBe(
      body.usage.input_tokens + body.usage.output_tokens,
    );
  });

  it("preserves instructions in the response", async () => {
    const app = getApp();
    await registerChatStub(app, "Instructed response");

    const res = await app.inject({
      method: "POST",
      url: "/v1/responses",
      payload: {
        model: "gpt-4o",
        input: "Hi",
        instructions: "Be helpful",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.instructions).toBe("Be helpful");
  });

  it("shares stubs with chat completions", async () => {
    const app = getApp();
    await registerChatStub(app, "Shared stub!", "gpt-4o");

    // Works via chat completions
    const chatRes = await app.inject({
      method: "POST",
      url: "/v1/chat/completions",
      payload: {
        model: "gpt-4o",
        messages: [{ role: "user", content: "Hi" }],
      },
    });
    expect(chatRes.statusCode).toBe(200);
    expect(chatRes.json().choices[0].message.content).toBe("Shared stub!");

    // Same stub works via responses API
    const respRes = await app.inject({
      method: "POST",
      url: "/v1/responses",
      payload: {
        model: "gpt-4o",
        input: "Hi",
      },
    });
    expect(respRes.statusCode).toBe(200);
    expect(respRes.json().output_text).toBe("Shared stub!");
  });
});
