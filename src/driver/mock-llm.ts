import { GivenStubs } from "../stubs/given.js";
import { ExpectConditions } from "../stubs/expect.js";
import { ServerNotStartedError } from "../errors/lifecycle.errors.js";
import { buildApp } from "../server/app.js";

type MockLLMState = "idle" | "starting" | "running" | "stopping" | "stopped";

export class MockLLM {
  private state: MockLLMState = "idle";
  private startPromise: Promise<void> | null = null;
  private app: Awaited<ReturnType<typeof buildApp>> | null = null;
  private _given: GivenStubs | null = null;
  private _expect: ExpectConditions | null = null;
  private _baseUrl: string | null = null;

  async start(): Promise<void> {
    if (this.state === "running") return;
    if (this.state === "starting" && this.startPromise) return this.startPromise;

    this.state = "starting";
    this.startPromise = this.doStart();
    return this.startPromise;
  }

  private async doStart(): Promise<void> {
    this.app = await buildApp({ logger: false });
    await this.app.listen({ port: 0, host: "127.0.0.1" });

    const address = this.app.server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    this._baseUrl = `http://127.0.0.1:${port}`;
    this._given = new GivenStubs(this.app.stubRegistry);
    this._expect = new ExpectConditions(this.app.authConfig);
    this.state = "running";
  }

  async stop(): Promise<void> {
    if (this.state === "stopped" || this.state === "idle") return;
    this.state = "stopping";
    try {
      if (this.app) {
        await this.app.close();
      }
    } finally {
      this.state = "stopped";
      this.app = null;
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

  clear(): void {
    this.assertRunning();
    this.app!.stubRegistry.clear();
    this.app!.stubRegistry.clearRequests();
    this.app!.authConfig.apiKey = undefined;
  }

  async [Symbol.asyncDispose](): Promise<void> {
    await this.stop();
  }

  private assertRunning(): void {
    if (this.state !== "running") {
      throw new ServerNotStartedError();
    }
  }
}
