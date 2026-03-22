import type { StubRegistry } from "../server/stubs/stub.registry.js";
import type { StubResponseConfig } from "../server/stubs/stub.types.js";

export class ModelsStubBuilder {
  constructor(private readonly registry: StubRegistry) {}

  willReturn(models: Array<{ id: string; ownedBy?: string }>): void {
    const response: StubResponseConfig = { type: "models", models };
    this.registry.register({}, response);
  }
}
