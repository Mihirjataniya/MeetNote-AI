import { Server } from "socket.io";
import type { Server as HttpServer } from "node:http";
import { config } from "../config/index";
import { authService } from "../services/authService";
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

  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) {
      next(new Error("Authentication required"));
      return;
    }

    try {
      const payload = authService.verifyToken(token);
      socket.data.userId = payload.userId;
      socket.data.displayName = payload.displayName;
      socket.data.email = payload.email;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  registerMediasoupHandlers(io);
  registerRoomHandlers(io);

  console.log("Socket.IO server initialized");

  return io;
}
