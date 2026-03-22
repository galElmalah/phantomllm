import { describe, it, expect } from "vitest";
import { getApp } from "../fixtures/setup.js";
import { registerChatStub } from "../fixtures/stubs.js";

describe("multi-stub matching", () => {
  it("matches the correct stub by model", async () => {
    const app = getApp();
    await registerChatStub(app, "GPT-4 response", "gpt-4");
    await registerChatStub(app, "GPT-3.5 response", "gpt-3.5-turbo");

    const res4 = await app.inject({
      method: "POST",
      url: "/v1/chat/completions",
      payload: {
        model: "gpt-4",
        messages: [{ role: "user", content: "Hi" }],
      },
    });
    expect(res4.json().choices[0].message.content).toBe("GPT-4 response");

    const res35 = await app.inject({
      method: "POST",
      url: "/v1/chat/completions",
      payload: {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Hi" }],
      },
    });
    expect(res35.json().choices[0].message.content).toBe("GPT-3.5 response");
  });

  it("matches by message content", async () => {
    const app = getApp();
    await registerChatStub(app, "Weather response", undefined, "weather");
    await registerChatStub(app, "Code response", undefined, "code");

    const weatherRes = await app.inject({
      method: "POST",
      url: "/v1/chat/completions",
      payload: {
        model: "gpt-4",
        messages: [{ role: "user", content: "What is the weather today?" }],
      },
    });
    expect(weatherRes.json().choices[0].message.content).toBe(
      "Weather response",
    );

    const codeRes = await app.inject({
      method: "POST",
      url: "/v1/chat/completions",
      payload: {
        model: "gpt-4",
        messages: [{ role: "user", content: "Write some code" }],
      },
    });
    expect(codeRes.json().choices[0].message.content).toBe("Code response");
  });

  it("higher specificity wins", async () => {
    const app = getApp();
    // Catch-all stub (no model, no content match)
    await registerChatStub(app, "Catch-all response");
    // Specific stub (model only)
    await registerChatStub(app, "Specific model response", "gpt-4");

    const res = await app.inject({
      method: "POST",
      url: "/v1/chat/completions",
      payload: {
        model: "gpt-4",
        messages: [{ role: "user", content: "Hi" }],
      },
    });

    expect(res.json().choices[0].message.content).toBe(
      "Specific model response",
    );
  });

  it("first registered wins among equal specificity", async () => {
    const app = getApp();
    await registerChatStub(app, "First response", "gpt-4");
    await registerChatStub(app, "Second response", "gpt-4");

    const res = await app.inject({
      method: "POST",
      url: "/v1/chat/completions",
      payload: {
        model: "gpt-4",
        messages: [{ role: "user", content: "Hi" }],
      },
    });

    expect(res.json().choices[0].message.content).toBe("First response");
  });
});
