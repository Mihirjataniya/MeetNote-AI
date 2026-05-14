import { Server, Socket } from "socket.io";
import { roomService } from "../services/roomService";
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

export function registerRoomHandlers(io: TypedServer): void {
  io.on("connection", (socket: TypedSocket) => {
    console.log(`Client connected: ${socket.id} (${socket.data.displayName})`);
    socket.data.rooms = new Set();

    socket.on("create-room", (_payload, callback) => {
      try {
        const room = roomService.createRoom();
        roomService.addParticipant(
          room.roomId,
          socket.id,
          socket.data.displayName
        );
        socket.join(room.roomId);
        socket.data.rooms.add(room.roomId);

        callback({
          roomId: room.roomId,
          participants: roomService.getParticipants(room.roomId),
        });
      } catch {
        callback({ message: "Failed to create room" });
      }
    });

    socket.on("join-room", (payload, callback) => {
      try {
        if (!payload?.roomId || typeof payload.roomId !== "string") {
          callback({ message: "Room ID is required" });
          return;
        }

        const room = roomService.getRoom(payload.roomId);
        if (!room) {
          callback({ message: "Room not found" });
          return;
        }

        if (room.participants.has(socket.id)) {
          callback({ message: "Already in this room" });
          return;
        }

        const participant = roomService.addParticipant(
          payload.roomId,
          socket.id,
          socket.data.displayName
        );
        if (!participant) {
          callback({ message: "Failed to join room" });
          return;
        }

        socket.join(payload.roomId);
        socket.data.rooms.add(payload.roomId);

        socket.to(payload.roomId).emit("peer-joined", {
          roomId: payload.roomId,
          peer: {
            socketId: socket.id,
            displayName: socket.data.displayName,
            joinedAt: participant.joinedAt.toISOString(),
          },
        });

        callback({
          roomId: payload.roomId,
          participants: roomService.getParticipants(payload.roomId),
        });
      } catch {
        callback({ message: "Failed to join room" });
      }
    });

    socket.on("leave-room", (payload) => {
      try {
        if (!payload?.roomId) return;

        const removed = roomService.removeParticipant(
          payload.roomId,
          socket.id
        );
        if (!removed) return;

        socket.leave(payload.roomId);
        socket.data.rooms.delete(payload.roomId);

        socket.to(payload.roomId).emit("peer-left", {
          roomId: payload.roomId,
          socketId: socket.id,
          displayName: removed.displayName,
        });
      } catch {
        // silently handle — leave is fire-and-forget
      }
    });

    socket.on("get-participants", (payload, callback) => {
      try {
        if (!payload?.roomId || typeof payload.roomId !== "string") {
          callback({ message: "Room ID is required" });
          return;
        }

        const room = roomService.getRoom(payload.roomId);
        if (!room) {
          callback({ message: "Room not found" });
          return;
        }

        callback({
          roomId: payload.roomId,
          participants: roomService.getParticipants(payload.roomId),
        });
      } catch {
        callback({ message: "Failed to get participants" });
      }
    });

    socket.on("disconnect", (reason) => {
      console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);

      for (const roomId of socket.data.rooms) {
        const removed = roomService.removeParticipant(roomId, socket.id);
        if (removed) {
          socket.to(roomId).emit("peer-left", {
            roomId,
            socketId: socket.id,
            displayName: removed.displayName,
          });
        }
      }
    });
  });
}
