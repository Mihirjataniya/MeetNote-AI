import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { createServer } from "node:http";
import { config } from "./config/index";
import apiRoutes from "./routes/index";
import { createSocketServer } from "./socket/index";
import { mediasoupService } from "./services/mediasoupService";
import { connectDatabase } from "./db/index";

async function main() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use("/api", apiRoutes);

  const httpServer = createServer(app);

  await connectDatabase();
  await mediasoupService.initialize();

  createSocketServer(httpServer);

  httpServer.listen(config.port, () => {
    console.log(`MeetNote server running on port ${config.port}`);
  });

  const shutdown = async () => {
    console.log("Shutting down...");
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
