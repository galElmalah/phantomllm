import type { AdminClient } from "../driver/admin.client.js";

export class RequireConditions {
  constructor(private readonly adminClient: AdminClient) {}

  apiKey(key: string): void {
    this.adminClient.enqueueConfig({ apiKey: key });
  }
}
