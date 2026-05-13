import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { config } from "./config/index";
import apiRoutes from "./routes/index";
import { createSocketServer } from "./socket/index";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", apiRoutes);

const httpServer = createServer(app);

createSocketServer(httpServer);

httpServer.listen(config.port, () => {
  console.log(`MeetNote server running on port ${config.port}`);
});
