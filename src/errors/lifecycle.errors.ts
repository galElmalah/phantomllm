import { MockLLMError } from './base.js';

export class ServerNotStartedError extends MockLLMError {
  readonly code = 'SERVER_NOT_STARTED' as const;
  constructor(options?: { cause?: unknown }) {
    super(
      'MockLLM server is not running. Call `await mock.start()` before configuring stubs.',
      options,
    );
  }
}

export class ServerAlreadyStartedError extends MockLLMError {
  readonly code = 'SERVER_ALREADY_STARTED' as const;
  constructor(options?: { cause?: unknown }) {
    super(
      'MockLLM server is already running. Call `await mock.stop()` first if you need to restart.',
      options,
    );
  }
}
