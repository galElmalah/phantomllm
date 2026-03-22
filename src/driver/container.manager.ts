import { GenericContainer, Wait } from "testcontainers";
import type { StartedTestContainer } from "testcontainers";
import type { ContainerConfig } from "../types/config.js";

export class ContainerManager {
  private container: StartedTestContainer | null = null;

  constructor(private readonly config: ContainerConfig) {}

  async start(): Promise<{ host: string; port: number }> {
    const builder = new GenericContainer(this.config.image)
      .withExposedPorts(this.config.containerPort)
      .withWaitStrategy(
        Wait.forHttp("/_admin/health", this.config.containerPort)
          .forStatusCode(200),
      )
      .withStartupTimeout(this.config.startupTimeout)
      .withLabels({ "com.phantomllm": "true" });

    this.container = await builder.start();

    return {
      host: this.container.getHost(),
      port: this.container.getMappedPort(this.config.containerPort),
    };
  }

  async stop(): Promise<void> {
    if (this.container) {
      await this.container.stop();
      this.container = null;
    }
  }
}
