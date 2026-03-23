import type { StubRegistry } from "../server/stubs/stub.registry.js";
import type { StubMatcher, StubResponseConfig } from "../server/stubs/stub.types.js";

export class ResponseStubBuilder {
  private readonly matcher: StubMatcher = { endpoint: "chat" };

  constructor(private readonly registry: StubRegistry) {}

  forModel(model: string): this {
    this.matcher.model = model;
    return this;
  }

  withInputContaining(substring: string): this {
    this.matcher.content = substring;
    return this;
  }

  willReturn(content: string): void {
    const response: StubResponseConfig = { type: "chat", body: content };
    this.registry.register(this.matcher, response);
  }

  willStream(chunks: string[]): void {
    const response: StubResponseConfig = { type: "streaming-chat", chunks };
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
