import Fastify from "fastify";
import { stubRegistryPlugin } from "./plugins/registry.plugin.js";
import { adminRoutes } from "./admin/admin.routes.js";
import { chatRoutes } from "./chat/chat.routes.js";
import { embeddingsRoutes } from "./embeddings/embeddings.routes.js";
import { modelsRoutes } from "./models/models.routes.js";

export async function buildApp(
  opts: Record<string, unknown> = {},
): Promise<ReturnType<typeof Fastify>> {
  const app = Fastify(opts);

  await app.register(stubRegistryPlugin);
  await app.register(adminRoutes);
  await app.register(chatRoutes, { prefix: "/v1" });
  await app.register(embeddingsRoutes, { prefix: "/v1" });
  await app.register(modelsRoutes, { prefix: "/v1" });

  return app;
}
