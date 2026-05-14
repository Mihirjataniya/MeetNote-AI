import mongoose from "mongoose";
import { config } from "../config/index";

export async function connectDatabase(): Promise<void> {
  await mongoose.connect(config.mongodb.uri);
  console.log("Connected to MongoDB");
}
