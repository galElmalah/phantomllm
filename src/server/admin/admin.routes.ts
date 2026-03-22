import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import type {
  RegisterStubRequest,
  RegisterStubBatchRequest,
  HealthResponse,
  ClearStubsResponse,
} from "./admin.types.js";

export const adminRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post(
    "/_admin/stubs",
    async (
      request: FastifyRequest<{ Body: RegisterStubRequest }>,
      reply: FastifyReply,
    ) => {
      const { matcher, response, delay } = request.body;
      const stub = fastify.stubRegistry.register(matcher, response, delay);
      return reply.status(201).send({ id: stub.id, stub });
    },
  );

  fastify.post(
    "/_admin/stubs/batch",
    async (
      request: FastifyRequest<{ Body: RegisterStubBatchRequest }>,
      reply: FastifyReply,
    ) => {
      const { stubs: definitions } = request.body;
      const created = definitions.map((def) =>
        fastify.stubRegistry.register(def.matcher, def.response, def.delay),
      );
      return reply.status(201).send(created);
    },
  );

  fastify.delete("/_admin/stubs", async (_request, reply: FastifyReply) => {
    const count = fastify.stubRegistry.clear();
    const body: ClearStubsResponse = { cleared: count };
    return reply.send(body);
  });

  fastify.get("/_admin/health", async (_request, reply: FastifyReply) => {
    const body: HealthResponse = {
      status: "ok",
      stubCount: fastify.stubRegistry.getAll().length,
      uptime: process.uptime(),
    };
    return reply.send(body);
  });

  fastify.get("/_admin/requests", async (_request, reply: FastifyReply) => {
    return reply.send({ requests: fastify.stubRegistry.getRequests() });
  });

  fastify.delete("/_admin/requests", async (_request, reply: FastifyReply) => {
    fastify.stubRegistry.clearRequests();
    return reply.status(204).send();
  });

  fastify.post(
    "/_admin/config",
    async (
      request: FastifyRequest<{ Body: { apiKey?: string | null } }>,
      reply: FastifyReply,
    ) => {
      const { apiKey } = request.body;
      if (apiKey !== undefined) {
        fastify.authConfig.apiKey = apiKey ?? undefined;
      }
      return reply.send({ ok: true });
    },
  );
};
