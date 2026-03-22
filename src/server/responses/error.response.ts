import type { OpenAIErrorBody } from "../../types/openai.js";

export function buildErrorResponse(
  _status: number,
  message: string,
  type?: string,
): OpenAIErrorBody {
  return {
    error: {
      message,
      type: type ?? "invalid_request_error",
      param: null,
      code: null,
    },
  };
}

export function buildNoStubMatchResponse(
  method: string,
  path: string,
  model: string,
  messages?: unknown,
): { status: number; body: OpenAIErrorBody } {
  const msgSummary =
    messages !== undefined ? ` messages=${JSON.stringify(messages)}` : "";

  return {
    status: 418,
    body: buildErrorResponse(
      418,
      `No stub matched request: ${method} ${path} model=${model}${msgSummary}`,
      "stub_not_found",
    ),
  };
}
