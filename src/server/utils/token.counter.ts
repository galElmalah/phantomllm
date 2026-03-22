export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

export function estimatePromptTokens(
  messages: Array<{ role: string; content: string | null }>,
): number {
  let tokens = 2; // framing overhead
  for (const msg of messages) {
    tokens += 4; // per-message overhead
    tokens += estimateTokens(msg.content ?? "");
  }
  return tokens;
}
