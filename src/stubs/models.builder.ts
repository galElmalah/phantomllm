import type { AdminClient } from "../driver/admin.client.js";

export class ModelsStubBuilder {
  constructor(private readonly adminClient: AdminClient) {}

  willReturn(models: Array<{ id: string; ownedBy?: string }>): void {
    this.adminClient.enqueueStub({
      matcher: {},
      response: { type: "models", models },
    });
  }
}
