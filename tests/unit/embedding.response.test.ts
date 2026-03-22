import { describe, it, expect } from "vitest";
import { buildEmbeddingResponse } from "../../src/server/responses/embedding.response.js";

describe("buildEmbeddingResponse", () => {
  it("returns object: 'list'", () => {
    const result = buildEmbeddingResponse([[0.1, 0.2]], "text-embedding-3-small", "hello");
    expect(result.object).toBe("list");
  });

  it("data[0].embedding matches input vector", () => {
    const vec = [0.1, 0.2, 0.3];
    const result = buildEmbeddingResponse([vec], "text-embedding-3-small", "hello");
    expect(result.data[0]!.embedding).toEqual(vec);
  });

  it("data[0].object is 'embedding'", () => {
    const result = buildEmbeddingResponse([[0.1]], "text-embedding-3-small", "hello");
    expect(result.data[0]!.object).toBe("embedding");
  });

  it("multiple vectors create multiple data entries", () => {
    const vectors = [[0.1, 0.2], [0.3, 0.4], [0.5, 0.6]];
    const result = buildEmbeddingResponse(vectors, "text-embedding-3-small", ["a", "b", "c"]);
    expect(result.data).toHaveLength(3);
    expect(result.data[0]!.index).toBe(0);
    expect(result.data[1]!.index).toBe(1);
    expect(result.data[2]!.index).toBe(2);
  });

  it("usage has prompt_tokens > 0", () => {
    const result = buildEmbeddingResponse([[0.1]], "text-embedding-3-small", "hello world");
    expect(result.usage.prompt_tokens).toBeGreaterThan(0);
  });
});
