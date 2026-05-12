import express from "express";
import cors from "cors";
import { config } from "./config/index.js";
import apiRoutes from "./routes/index.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", apiRoutes);

app.listen(config.port, () => {
  console.log(`MeetNote server running on port ${config.port}`);
});
