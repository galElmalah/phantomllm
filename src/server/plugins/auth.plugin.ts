import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";

export interface AuthConfig {
  apiKey: string | undefined;
}

declare module "fastify" {
  interface FastifyInstance {
    authConfig: AuthConfig;
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  const config: AuthConfig = {
    apiKey: process.env["PHANTOMLLM_API_KEY"] || undefined,
  };

  fastify.decorate("authConfig", config);

  fastify.addHook("onRequest", async (request, reply) => {
    if (request.url.startsWith("/_admin")) return;
    if (!fastify.authConfig.apiKey) return;

    const header = request.headers.authorization;
    if (!header) {
      return reply.status(401).send({
        error: {
          message:
            "Missing Authorization header. Expected: Bearer <api-key>",
          type: "authentication_error",
          param: null,
          code: "missing_api_key",
        },
      });
    }

    const token = header.replace(/^Bearer\s+/i, "");
    if (token !== fastify.authConfig.apiKey) {
      return reply.status(401).send({
        error: {
          message: "Invalid API key provided.",
          type: "authentication_error",
          param: null,
          code: "invalid_api_key",
        },
      });
    }
  });
};

export const apiKeyAuthPlugin = fp(authPlugin, { name: "api-key-auth" });
