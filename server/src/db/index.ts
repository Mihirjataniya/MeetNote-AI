import dns from "node:dns";
import mongoose from "mongoose";
import { config } from "../config/index";

// Node.js v26 defaults to IPv6 DNS which can break Atlas SRV lookups
dns.setDefaultResultOrder("ipv4first");

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  }
}
