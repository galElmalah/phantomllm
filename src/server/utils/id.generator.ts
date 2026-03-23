import { randomBytes } from "node:crypto";

export function generateChatCompletionId(): string {
  return "chatcmpl-" + randomBytes(18).toString("base64url").slice(0, 24);
}

export function generateEmbeddingId(): string {
  return "embd-" + randomBytes(18).toString("base64url").slice(0, 24);
}

export function generateResponseId(): string {
  return "resp_" + randomBytes(16).toString("hex");
}

export function generateMessageId(): string {
  return "msg_" + randomBytes(16).toString("hex");
}
