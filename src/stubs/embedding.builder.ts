import type { AdminClient } from "../driver/admin.client.js";
import type { AdminStubMatcher } from "../driver/admin.client.types.js";

export class EmbeddingStubBuilder {
  private readonly matcher: AdminStubMatcher = { endpoint: "embeddings" };

  constructor(private readonly adminClient: AdminClient) {}

  forModel(model: string): this {
    this.matcher.model = model;
    return this;
  }

  willReturn(vector: number[] | number[][]): void {
    const vectors = Array.isArray(vector[0])
      ? (vector as number[][])
      : [vector as number[]];

    this.adminClient.enqueueStub({
      matcher: this.matcher,
      response: { type: "embedding", vectors },
    });
  }

  willError(statusCode: number, message: string): void {
    this.adminClient.enqueueStub({
      matcher: this.matcher,
      response: {
        type: "error",
        status: statusCode,
        error: { message, type: "api_error", code: null },
      },
    });
  }
}
