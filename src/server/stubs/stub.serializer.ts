import type { StubMatcher, StubResponseConfig, StubEntry } from "./stub.types.js";

export function deserializeStubRequest(body: unknown): {
  matcher: StubMatcher;
  response: StubResponseConfig;
  delay: number;
} {
  if (body === null || typeof body !== "object") {
    throw new Error("Request body must be a non-null object");
  }

  const obj = body as Record<string, unknown>;

  if (obj["response"] === undefined || typeof obj["response"] !== "object" || obj["response"] === null) {
    throw new Error("'response' field is required and must be an object");
  }

  const response = obj["response"] as Record<string, unknown>;
  if (typeof response["type"] !== "string") {
    throw new Error("'response.type' is required and must be a string");
  }

  const validTypes = ["chat", "streaming-chat", "embedding", "error", "models"];
  if (!validTypes.includes(response["type"])) {
    throw new Error(
      `'response.type' must be one of: ${validTypes.join(", ")}`,
    );
  }

  const matcher: StubMatcher = {};
  if (obj["matcher"] !== undefined) {
    if (typeof obj["matcher"] !== "object" || obj["matcher"] === null) {
      throw new Error("'matcher' must be an object if provided");
    }
    const m = obj["matcher"] as Record<string, unknown>;
    if (m["model"] !== undefined) {
      if (typeof m["model"] !== "string") throw new Error("'matcher.model' must be a string");
      matcher.model = m["model"];
    }
    if (m["content"] !== undefined) {
      if (typeof m["content"] !== "string") throw new Error("'matcher.content' must be a string");
      matcher.content = m["content"];
    }
    if (m["input"] !== undefined) {
      if (typeof m["input"] !== "string") throw new Error("'matcher.input' must be a string");
      matcher.input = m["input"];
    }
    if (m["endpoint"] !== undefined) {
      if (m["endpoint"] !== "chat" && m["endpoint"] !== "embeddings") {
        throw new Error("'matcher.endpoint' must be 'chat' or 'embeddings'");
      }
      matcher.endpoint = m["endpoint"];
    }
  }

  const delay =
    obj["delay"] !== undefined
      ? (typeof obj["delay"] === "number"
          ? obj["delay"]
          : (() => { throw new Error("'delay' must be a number"); })())
      : 0;

  return { matcher, response: obj["response"] as StubResponseConfig, delay };
}

export function serializeStub(stub: StubEntry): Record<string, unknown> {
  return {
    id: stub.id,
    createdAt: stub.createdAt,
    matcher: stub.matcher,
    response: stub.response,
    delay: stub.delay,
    callCount: stub.callCount,
  };
}
