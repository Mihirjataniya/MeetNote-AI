import { Server, Socket } from "socket.io";
import { roomService } from "../services/roomService";
import { meetingService } from "../services/meetingService";
import { recordingService } from "../services/recordingService";
import { pipelineService } from "../services/pipelineService";
import { Recording } from "../models/Recording";
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
    socket.join(`user:${socket.data.userId}`);

    socket.on("create-room", async (payload, callback) => {
      try {
        const room = roomService.createRoom();
        roomService.addParticipant(
          room.roomId,
          socket.id,
          socket.data.displayName
        );
        socket.join(room.roomId);
        socket.data.rooms.add(room.roomId);

        const meetingId = await meetingService.createMeeting(
          room.roomId,
          socket.data.userId,
          socket.data.displayName,
          { title: payload?.title, agenda: payload?.agenda }
        );
        if (meetingId) {
          room.meetingId = meetingId;
          await Recording.create({
            meetingId,
            recordedBy: socket.data.userId,
            status: "recording",
            startedAt: new Date(),
          });
        }

        recordingService.startRecording(room.roomId, meetingId ?? undefined);

        callback({
          roomId: room.roomId,
          meetingId: room.meetingId,
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
          callback({
            roomId: payload.roomId,
            meetingId: room.meetingId,
            participants: roomService.getParticipants(payload.roomId),
          });
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

        if (room.meetingId) {
          meetingService.addParticipant(
            room.meetingId,
            socket.data.userId,
            socket.data.displayName
          );
        }

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
          meetingId: room.meetingId,
          participants: roomService.getParticipants(payload.roomId),
        });
      } catch {
        callback({ message: "Failed to join room" });
      }
    });

    socket.on("leave-room", async (payload) => {
      if (!payload?.roomId) return;

      const room = roomService.getRoom(payload.roomId);
      const meetingId = room?.meetingId;
      const isLastParticipant = room?.participants.size === 1
        && room.participants.has(socket.id);

      let recordingResult = null;
      if (isLastParticipant && meetingId) {
        recordingResult = recordingService.stopRecording(payload.roomId);
      }

      let removed;
      try {
        removed = roomService.removeParticipant(payload.roomId, socket.id);
      } catch (err) {
        console.error(`[Room] removeParticipant threw for ${payload.roomId}:`, err);
        removed = room?.participants.get(socket.id);
        room?.participants.delete(socket.id);
        room?.peerMedia.delete(socket.id);
      }

      if (!removed) return;

      socket.leave(payload.roomId);
      socket.data.rooms.delete(payload.roomId);

      if (meetingId && isLastParticipant) {
        await meetingService.endMeeting(meetingId).catch((err) =>
          console.error("[Meeting] endMeeting failed:", err)
        );
        pipelineService
          .run(payload.roomId, meetingId, recordingResult)
          .catch((err) => console.error("[Pipeline] Failed:", err));
      } else if (meetingId) {
        meetingService
          .removeParticipant(meetingId, socket.data.userId)
          .catch((err) => console.error("[Meeting] removeParticipant failed:", err));
      }

      socket.to(payload.roomId).emit("peer-left", {
        roomId: payload.roomId,
        socketId: socket.id,
        displayName: removed.displayName,
      });
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

    socket.on("disconnect", async (reason) => {
      console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);

      for (const roomId of socket.data.rooms) {
        const room = roomService.getRoom(roomId);
        const meetingId = room?.meetingId;
        const isLastParticipant = room?.participants.size === 1
          && room.participants.has(socket.id);

        let recordingResult = null;
        if (isLastParticipant && meetingId) {
          recordingResult = recordingService.stopRecording(roomId);
        }

        let removed;
        try {
          removed = roomService.removeParticipant(roomId, socket.id);
        } catch (err) {
          console.error(`[Room] removeParticipant threw for ${roomId}:`, err);
          removed = room?.participants.get(socket.id);
          room?.participants.delete(socket.id);
          room?.peerMedia.delete(socket.id);
        }

        if (removed) {
          if (meetingId && isLastParticipant) {
            await meetingService.endMeeting(meetingId).catch((err) =>
              console.error("[Meeting] endMeeting failed:", err)
            );
            pipelineService
              .run(roomId, meetingId, recordingResult)
              .catch((err) => console.error("[Pipeline] Failed:", err));
          } else if (meetingId) {
            meetingService
              .removeParticipant(meetingId, socket.data.userId)
              .catch((err) => console.error("[Meeting] removeParticipant failed:", err));
          }

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
