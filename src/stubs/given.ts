import type { StubRegistry } from "../server/stubs/stub.registry.js";
import { ChatCompletionStubBuilder } from "./chat.builder.js";
import { EmbeddingStubBuilder } from "./embedding.builder.js";
import { ModelsStubBuilder } from "./models.builder.js";
import { ResponseStubBuilder } from "./response.builder.js";

export class GivenStubs {
  constructor(private readonly registry: StubRegistry) {}

  get chatCompletion(): ChatCompletionStubBuilder {
    return new ChatCompletionStubBuilder(this.registry);
  }

  get response(): ResponseStubBuilder {
    return new ResponseStubBuilder(this.registry);
  }

  get embedding(): EmbeddingStubBuilder {
    return new EmbeddingStubBuilder(this.registry);
  }

  get models(): ModelsStubBuilder {
    return new ModelsStubBuilder(this.registry);
  }
}
