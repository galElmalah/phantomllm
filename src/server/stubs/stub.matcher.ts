import type { StubMatcher, StubEntry } from "./stub.types.js";

export function matchModel(matcher: StubMatcher, model: string): boolean {
  if (matcher.model === undefined) return true;
  return matcher.model === model;
}

export function matchContent(
  matcher: StubMatcher,
  messages: Array<{ role: string; content: string | null }>,
): boolean {
  if (matcher.content === undefined) return true;
  const needle = matcher.content.toLowerCase();
  return messages.some(
    (m) =>
      m.role === "user" &&
      m.content !== null &&
      m.content.toLowerCase().includes(needle),
  );
}

export function matchInput(
  matcher: StubMatcher,
  input: string | string[],
): boolean {
  if (matcher.input === undefined) return true;
  const needle = matcher.input.toLowerCase();
  const items = Array.isArray(input) ? input : [input];
  return items.some((item) => item.toLowerCase().includes(needle));
}

export function stubMatches(
  entry: StubEntry,
  endpoint: "chat" | "embeddings",
  model: string,
  messages?: Array<{ role: string; content: string | null }>,
  input?: string | string[],
): boolean {
  const { matcher } = entry;

  if (matcher.endpoint !== undefined && matcher.endpoint !== endpoint) {
    return false;
  }

  if (!matchModel(matcher, model)) return false;

  if (messages !== undefined && !matchContent(matcher, messages)) return false;

  if (input !== undefined && !matchInput(matcher, input)) return false;

  return true;
}

export function specificity(matcher: StubMatcher): number {
  let count = 0;
  if (matcher.model !== undefined) count++;
  if (matcher.content !== undefined) count++;
  if (matcher.input !== undefined) count++;
  return count;
}
