import type { AdminClient } from "../driver/admin.client.js";
import type { AdminStubMatcher } from "../driver/admin.client.types.js";

export class ChatCompletionStubBuilder {
  private readonly matcher: AdminStubMatcher = { endpoint: "chat" };

  constructor(private readonly adminClient: AdminClient) {}

  forModel(model: string): this {
    this.matcher.model = model;
    return this;
  }

  withMessageContaining(substring: string): this {
    this.matcher.content = substring;
    return this;
  }

  willReturn(content: string): void {
    this.adminClient.enqueueStub({
      matcher: this.matcher,
      response: { type: "chat", body: content },
    });
  }

  willStream(chunks: string[]): void {
    this.adminClient.enqueueStub({
      matcher: this.matcher,
      response: { type: "streaming-chat", chunks },
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
