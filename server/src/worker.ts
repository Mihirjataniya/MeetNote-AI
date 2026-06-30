import mongoose from "mongoose";
import { connectDatabase } from "./db/index";
import { config } from "./config/index";
import {
  ensureQueues,
  startWorkers,
  stopWorkers,
  recoverStuckRecordings,
} from "./queue/index";
import dns from "node:dns/promises";

// Standalone queue-worker process. Runs the SQS consumer loops without the
// HTTP/socket/mediasoup server. Deploy alongside a web process that sets
// SQS_WORKER_ENABLED=false. Scale this independently of the media server.
async function main() {
  dns.setServers(["1.1.1.1"]);

  if (!config.sqs.workerEnabled) {
    // This entry point exists to run workers; refuse to start as a no-op.
    console.error("[Worker] SQS_WORKER_ENABLED=false — nothing to do. Exiting.");
    process.exit(1);
  }

  await connectDatabase();
  await ensureQueues();
  startWorkers();
  await recoverStuckRecordings().catch((err) =>
    console.error("[Worker] Recovery failed:", err)
  );

  console.log("MeetNote worker running");

  const shutdown = async () => {
    console.log("Worker shutting down...");
    stopWorkers();
    await mongoose.disconnect();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("Failed to start worker:", err);
  process.exit(1);
});
