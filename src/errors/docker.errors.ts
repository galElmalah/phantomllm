import { MockLLMError } from './base.js';

export class DockerNotAvailableError extends MockLLMError {
  readonly code = 'DOCKER_NOT_AVAILABLE' as const;
  constructor(options?: { cause?: unknown }) {
    super(
      'Docker is not running or not installed. Ensure Docker Desktop is running, or start the Docker daemon.',
      options,
    );
  }
}

export class ImageNotFoundError extends MockLLMError {
  readonly code = 'IMAGE_NOT_FOUND' as const;
  constructor(
    public readonly image: string,
    options?: { cause?: unknown },
  ) {
    super(
      `Docker image '${image}' not found. Run \`docker pull ${image}\` first.`,
      options,
    );
  }
}

export class ContainerStartTimeoutError extends MockLLMError {
  readonly code = 'CONTAINER_START_TIMEOUT' as const;
  constructor(
    public readonly timeoutMs: number,
    options?: { cause?: unknown },
  ) {
    super(
      `Container did not become healthy within ${timeoutMs}ms. Check that Docker is running and the image is available.`,
      options,
    );
  }
}
