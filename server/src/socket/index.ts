import { Server } from "socket.io";
import type { Server as HttpServer } from "node:http";
import { config } from "../config/index";
import { registerMediasoupHandlers } from "./mediasoupHandler";
import { registerRoomHandlers } from "./roomHandler";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "../types/index";

export function createSocketServer(httpServer: HttpServer) {
  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: config.cors.origin,
      methods: ["GET", "POST"],
    },
  });

  registerMediasoupHandlers(io);
  registerRoomHandlers(io);

  console.log("Socket.IO server initialized");

  return io;
}
