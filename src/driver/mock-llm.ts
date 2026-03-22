import type { MockLLMOptions } from "../types/config.js";
import { resolveContainerConfig } from "./container.config.js";
import { ContainerManager } from "./container.manager.js";
import { AdminClient } from "./admin.client.js";
import { GivenStubs } from "../stubs/given.js";
import { ExpectConditions } from "../stubs/expect.js";
import { ContainerNotStartedError } from "../errors/lifecycle.errors.js";

type MockLLMState = "idle" | "starting" | "running" | "stopping" | "stopped";

export class MockLLM {
  private state: MockLLMState = "idle";
  private startPromise: Promise<void> | null = null;
  private containerManager: ContainerManager;
  private adminClient: AdminClient | null = null;
  private _given: GivenStubs | null = null;
  private _expect: ExpectConditions | null = null;
  private _baseUrl: string | null = null;

  constructor(options?: MockLLMOptions) {
    const config = resolveContainerConfig(options);
    this.containerManager = new ContainerManager(config);
  }

  async start(): Promise<void> {
    if (this.state === "running") return;
    if (this.state === "starting" && this.startPromise) return this.startPromise;

    this.state = "starting";
    this.startPromise = this.doStart();
    return this.startPromise;
  }

  private async doStart(): Promise<void> {
    const { host, port } = await this.containerManager.start();
    this._baseUrl = `http://${host}:${port}`;
    this.adminClient = new AdminClient(this._baseUrl);
    this._given = new GivenStubs(this.adminClient);
    this._expect = new ExpectConditions(this.adminClient);
    this.state = "running";
  }

  async stop(): Promise<void> {
    if (this.state === "stopped" || this.state === "idle") return;
    this.state = "stopping";
    try {
      await this.containerManager.stop();
    } finally {
      this.state = "stopped";
      this.adminClient = null;
      this._given = null;
      this._expect = null;
      this._baseUrl = null;
    }
  }

  get baseUrl(): string {
    this.assertRunning();
    return this._baseUrl!;
  }

  get apiBaseUrl(): string {
    return `${this.baseUrl}/v1`;
  }

  get given(): GivenStubs {
    this.assertRunning();
    return this._given!;
  }

  get expect(): ExpectConditions {
    this.assertRunning();
    return this._expect!;
  }

  async clear(): Promise<void> {
    this.assertRunning();
    await this.adminClient!.clearStubs();
  }

  async [Symbol.asyncDispose](): Promise<void> {
    await this.stop();
  }

  private assertRunning(): void {
    if (this.state !== "running") {
      throw new ContainerNotStartedError();
    }
  }
}
