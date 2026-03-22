import { MockLLMError } from './base.js';

export class ContainerNotStartedError extends MockLLMError {
  readonly code = 'CONTAINER_NOT_STARTED' as const;
  constructor(options?: { cause?: unknown }) {
    super(
      'MockLLM container is not running. Call `await mock.start()` before configuring stubs.',
      options,
    );
  }
}

export class ContainerAlreadyStartedError extends MockLLMError {
  readonly code = 'CONTAINER_ALREADY_STARTED' as const;
  constructor(options?: { cause?: unknown }) {
    super(
      'MockLLM container is already running. Call `await mock.stop()` first if you need to restart.',
      options,
    );
  }
}
