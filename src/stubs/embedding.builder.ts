import type { StubRegistry } from "../server/stubs/stub.registry.js";
import type { StubMatcher, StubResponseConfig } from "../server/stubs/stub.types.js";

export class EmbeddingStubBuilder {
  private readonly matcher: StubMatcher = { endpoint: "embeddings" };

  constructor(private readonly registry: StubRegistry) {}

  forModel(model: string): this {
    this.matcher.model = model;
    return this;
  }

  willReturn(vector: number[] | number[][]): void {
    const vectors = Array.isArray(vector[0])
      ? (vector as number[][])
      : [vector as number[]];

    const response: StubResponseConfig = { type: "embedding", vectors };
    this.registry.register(this.matcher, response);
  }

  willError(statusCode: number, message: string): void {
    const response: StubResponseConfig = {
      type: "error",
      status: statusCode,
      error: { message, type: "api_error", code: null },
    };
    this.registry.register(this.matcher, response);
  }
}
