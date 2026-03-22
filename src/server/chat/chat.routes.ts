import type { FastifyPluginAsync } from "fastify";
import { handleChatCompletion } from "./chat.handler.js";

export const chatRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post("/chat/completions", handleChatCompletion);
};
