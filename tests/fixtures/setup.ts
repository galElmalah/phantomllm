import { beforeAll, afterAll, afterEach } from "vitest";
import { buildApp } from "../../src/server/app.js";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance | undefined;

export function getApp(): FastifyInstance {
  if (!app) throw new Error("App not initialized");
  return app;
}

beforeAll(async () => {
  app = await buildApp({ logger: false });
  await app.ready();
});

afterAll(async () => {
  if (app) {
    await app.close();
    app = undefined;
  }
});

afterEach(async () => {
  if (app) {
    await app.inject({ method: "DELETE", url: "/_admin/stubs" });
    await app.inject({ method: "DELETE", url: "/_admin/requests" });
  }
});
