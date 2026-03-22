import { buildApp } from "./app.js";
import { PORT, HOST } from "./env.js";

const app = await buildApp({ logger: true });

const shutdown = async (): Promise<void> => {
  await app.close();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

await app.listen({ port: PORT, host: HOST });

const address = app.server.address();
const boundPort = typeof address === "object" && address ? address.port : PORT;

if (process.send) {
  process.send({ type: "ready", port: boundPort });
}
