import type { AdminClient } from "../driver/admin.client.js";
import { ChatCompletionStubBuilder } from "./chat.builder.js";
import { EmbeddingStubBuilder } from "./embedding.builder.js";
import { ModelsStubBuilder } from "./models.builder.js";

export class GivenStubs {
  constructor(private readonly adminClient: AdminClient) {}

  get chatCompletion(): ChatCompletionStubBuilder {
    return new ChatCompletionStubBuilder(this.adminClient);
  }

  get embedding(): EmbeddingStubBuilder {
    return new EmbeddingStubBuilder(this.adminClient);
  }

  get models(): ModelsStubBuilder {
    return new ModelsStubBuilder(this.adminClient);
  }
}
