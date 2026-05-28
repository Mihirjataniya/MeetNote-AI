import type { Server, Socket } from "socket.io";
import { roomService } from "../services/roomService";
import { ChatMessage } from "../models/ChatMessage";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "../types/index";

type TypedServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;
type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export function registerChatHandlers(io: TypedServer): void {
  io.on("connection", (socket: TypedSocket) => {
    socket.on("send-message", async (payload, callback) => {
      try {
        const text = payload?.text?.trim();
        if (!text || !payload?.roomId) {
          callback({ message: "roomId and text are required" });
          return;
        }

        if (text.length > 2000) {
          callback({ message: "Message too long" });
          return;
        }

        const room = roomService.getRoom(payload.roomId);
        if (!room || !room.meetingId) {
          callback({ message: "Room not found" });
          return;
        }

        if (!room.participants.has(socket.id)) {
          callback({ message: "Not a participant of this room" });
          return;
        }

        const msg = await ChatMessage.create({
          meetingId: room.meetingId,
          userId: socket.data.userId,
          displayName: socket.data.displayName,
          text,
        });

        const chatPayload = {
          id: msg._id.toString(),
          userId: socket.data.userId,
          displayName: socket.data.displayName,
          text,
          createdAt: msg.createdAt.toISOString(),
        };

        io.to(payload.roomId).emit("chat-message", chatPayload);
        callback({ messageId: msg._id.toString() });
      } catch {
        callback({ message: "Failed to send message" });
      }
    });
  });
}
