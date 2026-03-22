import { MockLLMError } from './base.js';

export class AdminAPIError extends MockLLMError {
  readonly code = 'ADMIN_API_ERROR' as const;
  constructor(
    public readonly statusCode: number,
    public readonly responseBody: string,
    options?: { cause?: unknown },
  ) {
    super(
      `Admin API returned HTTP ${statusCode}: ${responseBody}`,
      options,
    );
  }
}

export class AdminConnectionRefusedError extends MockLLMError {
  readonly code = 'ADMIN_CONNECTION_REFUSED' as const;
  constructor(options?: { cause?: unknown }) {
    super(
      'Cannot connect to MockLLM admin API. The container may have crashed.',
      options,
    );
  }
}

export class AdminTimeoutError extends MockLLMError {
  readonly code = 'ADMIN_TIMEOUT' as const;
  constructor(
    public readonly timeoutMs: number,
    options?: { cause?: unknown },
  ) {
    super(
      `Admin API did not respond within ${timeoutMs}ms.`,
      options,
    );
  }
}
