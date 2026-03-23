import type { FastifyPluginAsync } from "fastify";
import { handleResponse } from "./responses.handler.js";

export const responsesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post("/responses", handleResponse);
};
