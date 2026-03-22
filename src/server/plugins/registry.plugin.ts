import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import { StubRegistry } from "../stubs/stub.registry.js";

declare module "fastify" {
  interface FastifyInstance {
    stubRegistry: StubRegistry;
  }
}

const registryPlugin: FastifyPluginAsync = async (fastify) => {
  const registry = new StubRegistry();
  fastify.decorate("stubRegistry", registry);
};

export const stubRegistryPlugin = fp(registryPlugin, {
  name: "stub-registry",
});
