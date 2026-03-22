import { randomBytes } from "node:crypto";

export function generateChatCompletionId(): string {
  return "chatcmpl-" + randomBytes(18).toString("base64url").slice(0, 24);
}

export function generateEmbeddingId(): string {
  return "embd-" + randomBytes(18).toString("base64url").slice(0, 24);
}
