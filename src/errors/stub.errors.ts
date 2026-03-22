import { MockLLMError } from './base.js';

export class StubConfigurationError extends MockLLMError {
  readonly code = 'STUB_CONFIGURATION_INVALID' as const;
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
  }
}
