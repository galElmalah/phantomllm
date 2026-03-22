import { randomUUID } from "node:crypto";
import type { StubMatcher, StubResponseConfig, StubEntry } from "./stub.types.js";
import { stubMatches, specificity } from "./stub.matcher.js";
import type { RecordedRequest } from "../admin/admin.types.js";

export class StubRegistry {
  private stubs: StubEntry[] = [];
  private requests: RecordedRequest[] = [];

  register(
    matcher: StubMatcher,
    response: StubResponseConfig,
    delay?: number,
  ): StubEntry {
    const entry: StubEntry = {
      id: randomUUID(),
      createdAt: Date.now(),
      matcher,
      response,
      delay: delay ?? 0,
      callCount: 0,
    };
    this.stubs.push(entry);
    return entry;
  }

  findMatch(
    endpoint: "chat" | "embeddings",
    model: string,
    messages?: Array<{ role: string; content: string | null }>,
    input?: string | string[],
  ): StubEntry | undefined {
    const matches = this.stubs.filter((s) =>
      stubMatches(s, endpoint, model, messages, input),
    );

    if (matches.length === 0) return undefined;

    matches.sort((a, b) => {
      const specDiff = specificity(b.matcher) - specificity(a.matcher);
      if (specDiff !== 0) return specDiff;
      return a.createdAt - b.createdAt;
    });

    const match = matches[0]!;
    match.callCount++;
    return match;
  }

  clear(): number {
    const count = this.stubs.length;
    this.stubs = [];
    return count;
  }

  getAll(): readonly StubEntry[] {
    return this.stubs;
  }

  recordRequest(request: RecordedRequest): void {
    this.requests.push(request);
  }

  getRequests(): readonly RecordedRequest[] {
    return this.requests;
  }

  clearRequests(): void {
    this.requests = [];
  }
}
