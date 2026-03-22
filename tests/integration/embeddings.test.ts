import { describe, it, expect } from "vitest";
import { getApp } from "../fixtures/setup.js";
import { registerEmbeddingStub } from "../fixtures/stubs.js";

describe("embeddings", () => {
  it("returns a stubbed embedding vector", async () => {
    const app = getApp();
    const vector = [0.1, 0.2, 0.3, 0.4, 0.5];
    await registerEmbeddingStub(app, [vector]);

    const res = await app.inject({
      method: "POST",
      url: "/v1/embeddings",
      payload: {
        model: "text-embedding-3-small",
        input: "Hello world",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].embedding).toEqual(vector);
  });

  it("returns default embedding when no stub matches", async () => {
    const app = getApp();

    const res = await app.inject({
      method: "POST",
      url: "/v1/embeddings",
      payload: {
        model: "text-embedding-3-small",
        input: "Hello world",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].embedding).toHaveLength(1536);
    // Default embedding is all zeros
    expect(body.data[0].embedding.every((v: number) => v === 0)).toBe(true);
  });

  it("returns correct object types", async () => {
    const app = getApp();
    await registerEmbeddingStub(app, [[0.1, 0.2]]);

    const res = await app.inject({
      method: "POST",
      url: "/v1/embeddings",
      payload: {
        model: "text-embedding-3-small",
        input: "test",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.object).toBe("list");
    expect(body.data[0].object).toBe("embedding");
    expect(body.data[0].index).toBe(0);
    expect(body.model).toBe("text-embedding-3-small");
  });
});
