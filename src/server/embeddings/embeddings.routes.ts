import type { FastifyPluginAsync } from "fastify";
import { handleEmbeddings } from "./embeddings.handler.js";

export const embeddingsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post("/embeddings", handleEmbeddings);
};
