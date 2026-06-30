import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { createServer } from "node:http";
import { config } from "./config/index";
import apiRoutes from "./routes/index";
import { createSocketServer } from "./socket/index";
import { mediasoupService } from "./services/mediasoupService";
import { connectDatabase } from "./db/index";
import { ensureQueues, startWorkers, stopWorkers, recoverStuckRecordings } from "./queue/index";
import dns from "node:dns/promises";

// [ '127.0.0.53' ]

async function main() {
  const app = express();
  dns.setServers(["1.1.1.1"]);
  app.use(cors());
  app.use(express.json());

  app.use("/api", apiRoutes);

  const httpServer = createServer(app);

  await connectDatabase();
  await mediasoupService.initialize();

  // ensureQueues is always needed: this process enqueues jobs even when its
  // own consumers are disabled (split deployment). startWorkers + recovery
  // only run when workers live in-process (single-process deployment); in a
  // split setup the standalone worker.ts owns those.
  await ensureQueues();
  startWorkers();
  if (config.sqs.workerEnabled) {
    await recoverStuckRecordings().catch((err) =>
      console.error("[Queue] Recovery failed:", err)
    );
  }

  createSocketServer(httpServer);

  httpServer.listen(config.port, () => {
    console.log(`MeetNote server running on port ${config.port}`);
  });

  const shutdown = async () => {
    console.log("Shutting down...");
    stopWorkers();
    await mediasoupService.closeWorker();
    await mongoose.disconnect();
    httpServer.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
