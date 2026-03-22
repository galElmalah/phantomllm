import type { FastifyPluginAsync } from "fastify";
import type { ModelListResponse, ModelObject } from "../../types/openai.js";

const DEFAULT_MODELS: ModelObject[] = [
  { id: "gpt-4", object: "model", created: 1687882411, owned_by: "openai" },
  { id: "gpt-4o", object: "model", created: 1715367049, owned_by: "openai" },
  {
    id: "gpt-3.5-turbo",
    object: "model",
    created: 1677610602,
    owned_by: "openai",
  },
  {
    id: "text-embedding-3-small",
    object: "model",
    created: 1705948997,
    owned_by: "openai",
  },
];

export const modelsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/models", async (_request, reply) => {
    const registry = fastify.stubRegistry;
    const allStubs = registry.getAll();
    const modelsStub = allStubs.find((s) => s.response.type === "models");

    if (modelsStub) {
      modelsStub.callCount++;
      const config = modelsStub.response;
      if (config.type !== "models") return;

      const data: ModelObject[] = config.models.map((m) => ({
        id: m.id,
        object: "model" as const,
        created: Math.floor(Date.now() / 1000),
        owned_by: m.ownedBy ?? "phantomllm",
      }));

      const body: ModelListResponse = { object: "list", data };
      return reply.send(body);
    }

    const body: ModelListResponse = { object: "list", data: DEFAULT_MODELS };
    return reply.send(body);
  });
};
