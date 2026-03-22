import {
  AdminConnectionRefusedError,
  AdminTimeoutError,
  AdminAPIError,
} from "../errors/admin.errors.js";
import type {
  AdminStubDefinition,
  AdminHealthPayload,
  AdminRecordedRequestPayload,
} from "./admin.client.types.js";

const REQUEST_TIMEOUT_MS = 5_000;

export class AdminClient {
  private pendingStubs: AdminStubDefinition[] = [];

  constructor(private readonly baseUrl: string) {}

  enqueueStub(stub: AdminStubDefinition): void {
    this.pendingStubs.push(stub);
  }

  async flush(): Promise<void> {
    if (this.pendingStubs.length === 0) return;
    const stubs = this.pendingStubs.splice(0);
    await this.post("/_admin/stubs/batch", { stubs });
  }

  async clearStubs(): Promise<void> {
    await this.flush();
    await this.delete("/_admin/stubs");
  }

  async getHealth(): Promise<AdminHealthPayload> {
    return this.get<AdminHealthPayload>("/_admin/health");
  }

  async getRequests(): Promise<AdminRecordedRequestPayload["requests"]> {
    await this.flush();
    const data = await this.get<AdminRecordedRequestPayload>("/_admin/requests");
    return data.requests;
  }

  private async get<T>(path: string): Promise<T> {
    const response = await this.fetch(path, { method: "GET" });
    return (await response.json()) as T;
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const response = await this.fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await response.json()) as T;
  }

  private async delete(path: string): Promise<void> {
    await this.fetch(path, { method: "DELETE" });
  }

  private async fetch(path: string, init: RequestInit): Promise<Response> {
    const url = `${this.baseUrl}${path}`;
    let response: Response;

    try {
      response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error: unknown) {
      if (error instanceof TypeError) {
        const cause = error.cause as { code?: string } | undefined;
        if (cause?.code === "ECONNREFUSED") {
          throw new AdminConnectionRefusedError({ cause: error });
        }
      }
      if (error instanceof DOMException && error.name === "TimeoutError") {
        throw new AdminTimeoutError(REQUEST_TIMEOUT_MS, { cause: error });
      }
      throw error;
    }

    if (!response.ok) {
      const body = await response.text();
      throw new AdminAPIError(response.status, body);
    }

    return response;
  }
}
