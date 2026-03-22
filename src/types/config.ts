export interface MockLLMOptions {
  image?: string;
  containerPort?: number;
  reuse?: boolean;
  startupTimeout?: number;
}

export interface ContainerConfig {
  image: string;
  containerPort: number;
  reuse: boolean;
  startupTimeout: number;
}

export const DEFAULT_CONFIG: ContainerConfig = {
  image: 'phantomllm-server:latest',
  containerPort: 8080,
  reuse: true,
  startupTimeout: 30_000,
};

export function resolveConfig(options?: MockLLMOptions): ContainerConfig {
  return {
    image: options?.image ?? DEFAULT_CONFIG.image,
    containerPort: options?.containerPort ?? DEFAULT_CONFIG.containerPort,
    reuse: options?.reuse ?? DEFAULT_CONFIG.reuse,
    startupTimeout: options?.startupTimeout ?? DEFAULT_CONFIG.startupTimeout,
  };
}
