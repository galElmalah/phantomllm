import type { MockLLMOptions, ContainerConfig } from "../types/config.js";

const DEFAULT_IMAGE = "mock-llm-server:latest";
const DEFAULT_PORT = 8080;

export function resolveContainerConfig(options?: MockLLMOptions): ContainerConfig {
  return {
    image: options?.image ?? process.env["MOCK_LLM_IMAGE"] ?? DEFAULT_IMAGE,
    containerPort: options?.containerPort ?? DEFAULT_PORT,
    reuse: options?.reuse ?? true,
    startupTimeout: options?.startupTimeout ?? 30_000,
  };
}
