import { Server, Socket } from "socket.io";
import { Types } from "mongoose";
import { roomService } from "../services/roomService";
import { meetingService } from "../services/meetingService";
import { recordingService } from "../services/recordingService";
import { pipelineService } from "../services/pipelineService";
import { scheduleService, ScheduleError } from "../services/scheduleService";
import {
  notifyMeetingStateChanged,
  notifyHostJoinRequestMissed,
} from "../services/notificationService";
import { Meeting } from "../models/Meeting";
import { Recording } from "../models/Recording";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  JoinRoomPayload,
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

function notifyHostsOfPending(
  io: TypedServer,
  roomId: string,
  socketId: string,
  userId: string,
  displayName: string,
  requestedAtIso: string
): void {
  const hostSocketIds = roomService.getHostSocketIds(roomId);
  for (const hostSocketId of hostSocketIds) {
    io.to(hostSocketId).emit("join-requested", {
      roomId,
      request: { socketId, userId, displayName, requestedAt: requestedAtIso },
    });
  }
}

function notifyHostsOfCancellation(
  io: TypedServer,
  roomId: string,
  socketId: string
): void {
  const hostSocketIds = roomService.getHostSocketIds(roomId);
  for (const hostSocketId of hostSocketIds) {
    io.to(hostSocketId).emit("join-request-cancelled", { roomId, socketId });
  }
}

function promoteWaitingToPending(io: TypedServer, roomId: string): void {
  const room = roomService.getRoom(roomId);
  if (!room) return;
  if (room.waitingSockets.size === 0) return;
  if (!room.hostUserId) return;

  const sockets = io.sockets.sockets;
  const promoted: string[] = [];
  for (const socketId of room.waitingSockets) {
    const s = sockets.get(socketId);
    if (!s) continue;
    const req = roomService.addPendingRequest(
      roomId,
      socketId,
      s.data.userId,
      s.data.displayName
    );
    if (!req) continue;
    promoted.push(socketId);
    notifyHostsOfPending(io, roomId, socketId, s.data.userId, s.data.displayName, req.requestedAt.toISOString());
  }
  for (const socketId of promoted) {
    room.waitingSockets.delete(socketId);
  }
}

// ── Grace window for disconnects ──
// A socket disconnect (refresh, transient network drop) should NOT immediately
// end the meeting. We defer the end-of-meeting work; if the same user (or
// anyone) rejoins within the window, the cleanup is cancelled and the meeting
// continues seamlessly. Only an explicit "leave-room" ends immediately.
const GRACE_MS = 30_000;
const cleanupTimers = new Map<string, ReturnType<typeof setTimeout>>();

function cancelRoomCleanup(roomId: string): void {
  const t = cleanupTimers.get(roomId);
  if (t) {
    clearTimeout(t);
    cleanupTimers.delete(roomId);
  }
}

function scheduleRoomCleanup(roomId: string, meetingId: string | null): void {
  if (cleanupTimers.has(roomId)) return;
  const timer = setTimeout(async () => {
    cleanupTimers.delete(roomId);
    const room = roomService.getRoom(roomId);
    // Someone rejoined during the grace window — abort the teardown.
    if (room && room.participants.size > 0) return;

    if (meetingId) {
      const recordingResult = recordingService.stopRecording(roomId);
      await meetingService.endMeeting(meetingId).catch((err) =>
        console.error("[Meeting] endMeeting failed:", err)
      );
      pipelineService
        .run(roomId, meetingId, recordingResult)
        .catch((err) => console.error("[Pipeline] Failed:", err));
    }
    roomService.deleteRoom(roomId);
  }, GRACE_MS);
  cleanupTimers.set(roomId, timer);
}

async function handleScheduledJoin(
  io: TypedServer,
  socket: TypedSocket,
  payload: JoinRoomPayload,
  callback: (
    response:
      | {
          roomId: string;
          meetingId: string | null;
          participants: ReturnType<typeof roomService.getParticipants>;
          isHost: boolean;
          pendingRequests: ReturnType<typeof roomService.getPendingRequests>;
        }
      | { message: string }
  ) => void
): Promise<void> {
  const userId = socket.data.userId;
  const displayName = socket.data.displayName;
  const scheduledMeetingId = payload.scheduledMeetingId!;

  let meeting;
  let wasScheduled = false;
  try {
    const result = await scheduleService.convertScheduledToActive(scheduledMeetingId, userId);
    meeting = result.meeting;
    wasScheduled = result.wasScheduled;
  } catch (err) {
    if (err instanceof ScheduleError) {
      callback({ message: err.message });
    } else {
      console.error("[Schedule] join failed:", err);
      callback({ message: "Failed to join scheduled meeting" });
    }
    return;
  }

  if (meeting.roomId !== payload.roomId) {
    callback({ message: "Room ID mismatch" });
    return;
  }

  const isHostUser = meeting.createdBy.toString() === userId;
  if (
    !isHostUser &&
    !roomService.isApproved(meeting.roomId, socket.id) &&
    !roomService.isUserApproved(meeting.roomId, userId)
  ) {
    callback({ message: "Approval required to join this meeting" });
    return;
  }

  // (Re)joining — abort any pending grace teardown for this room.
  cancelRoomCleanup(meeting.roomId);

  let room = roomService.getRoom(meeting.roomId);
  const fresh = !room;
  if (!room) {
    room = roomService.createRoomWithId(meeting.roomId);
    room.meetingId = meeting._id.toString();
  } else if (!room.meetingId) {
    room.meetingId = meeting._id.toString();
  }

  if (isHostUser) {
    roomService.setHost(meeting.roomId, userId);
  }

  if (wasScheduled) {
    await Recording.create({
      meetingId: meeting._id.toString(),
      recordedBy: userId,
      status: "recording",
      startedAt: new Date(),
    }).catch((e) => console.error("[Schedule] Recording.create failed:", e));
    recordingService.startRecording(meeting.roomId, meeting._id.toString());
    notifyMeetingStateChanged([meeting._id.toString()], "started").catch((e) =>
      console.error("[Schedule] notify started failed:", e)
    );
  } else if (fresh) {
    recordingService.startRecording(meeting.roomId, meeting._id.toString());
  }

  if (room.participants.has(socket.id)) {
    callback({
      roomId: meeting.roomId,
      meetingId: meeting._id.toString(),
      participants: roomService.getParticipants(meeting.roomId),
      isHost: isHostUser,
      pendingRequests: isHostUser ? roomService.getPendingRequests(meeting.roomId) : [],
    });
    return;
  }

  const participant = roomService.addParticipant(meeting.roomId, socket.id, userId, displayName);
  if (!participant) {
    callback({ message: "Failed to join room" });
    return;
  }

  socket.join(meeting.roomId);
  socket.data.rooms.add(meeting.roomId);

  if (!isHostUser) {
    roomService.consumeApproval(meeting.roomId, socket.id);
    roomService.approveUser(meeting.roomId, userId);
  }

  meetingService.addParticipant(meeting._id.toString(), userId, displayName);

  socket.to(meeting.roomId).emit("peer-joined", {
    roomId: meeting.roomId,
    peer: {
      socketId: socket.id,
      userId,
      displayName,
      joinedAt: participant.joinedAt.toISOString(),
      role: participant.role,
    },
  });

  if (isHostUser) {
    promoteWaitingToPending(io, meeting.roomId);
  }

  callback({
    roomId: meeting.roomId,
    meetingId: meeting._id.toString(),
    participants: roomService.getParticipants(meeting.roomId),
    isHost: isHostUser,
    pendingRequests: isHostUser ? roomService.getPendingRequests(meeting.roomId) : [],
  });
}

async function resolveScheduledHostUserId(
  scheduledMeetingId: string | undefined
): Promise<string | null> {
  if (!scheduledMeetingId) return null;
  if (!Types.ObjectId.isValid(scheduledMeetingId)) return null;
  const meeting = await Meeting.findById(scheduledMeetingId)
    .select({ createdBy: 1, roomId: 1 })
    .lean();
  if (!meeting) return null;
  return meeting.createdBy.toString();
}

export function registerRoomHandlers(io: TypedServer): void {
  io.on("connection", (socket: TypedSocket) => {
    console.log(`Client connected: ${socket.id} (${socket.data.displayName})`);
    socket.data.rooms = new Set();
    socket.join(`user:${socket.data.userId}`);

    socket.on("create-room", async (payload, callback) => {
      try {
        const room = roomService.createRoom();
        roomService.setHost(room.roomId, socket.data.userId);
        const participant = roomService.addParticipant(
          room.roomId,
          socket.id,
          socket.data.userId,
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
          isHost: true,
          pendingRequests: roomService.getPendingRequests(room.roomId),
        });

        if (participant) {
          promoteWaitingToPending(io, room.roomId);
        }
      } catch {
        callback({ message: "Failed to create room" });
      }
    });

    socket.on("join-room", async (payload, callback) => {
      try {
        if (!payload?.roomId || typeof payload.roomId !== "string") {
          callback({ message: "Room ID is required" });
          return;
        }

        if (payload.scheduledMeetingId) {
          await handleScheduledJoin(io, socket, payload, callback);
          return;
        }

        const room = roomService.getRoom(payload.roomId);
        if (!room) {
          callback({ message: "Room not found" });
          return;
        }

        const isHostUser = room.hostUserId === socket.data.userId;
        if (
          !isHostUser &&
          !roomService.isApproved(payload.roomId, socket.id) &&
          !roomService.isUserApproved(payload.roomId, socket.data.userId)
        ) {
          callback({ message: "Approval required to join this meeting" });
          return;
        }

        // A participant is (re)joining — abort any pending grace teardown.
        cancelRoomCleanup(payload.roomId);

        if (room.participants.has(socket.id)) {
          callback({
            roomId: payload.roomId,
            meetingId: room.meetingId,
            participants: roomService.getParticipants(payload.roomId),
            isHost: isHostUser,
            pendingRequests: isHostUser ? roomService.getPendingRequests(payload.roomId) : [],
          });
          return;
        }

        const participant = roomService.addParticipant(
          payload.roomId,
          socket.id,
          socket.data.userId,
          socket.data.displayName
        );
        if (!participant) {
          callback({ message: "Failed to join room" });
          return;
        }

        socket.join(payload.roomId);
        socket.data.rooms.add(payload.roomId);

        if (!isHostUser) {
          roomService.consumeApproval(payload.roomId, socket.id);
          // Keep userId-level approval so future reconnects skip the lobby.
          roomService.approveUser(payload.roomId, socket.data.userId);
        }

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
            userId: socket.data.userId,
            displayName: socket.data.displayName,
            joinedAt: participant.joinedAt.toISOString(),
            role: participant.role,
          },
        });

        if (isHostUser) {
          promoteWaitingToPending(io, payload.roomId);
        }

        callback({
          roomId: payload.roomId,
          meetingId: room.meetingId,
          participants: roomService.getParticipants(payload.roomId),
          isHost: isHostUser,
          pendingRequests: isHostUser ? roomService.getPendingRequests(payload.roomId) : [],
        });
      } catch {
        callback({ message: "Failed to join room" });
      }
    });

    socket.on("request-join", async (payload, callback) => {
      try {
        if (!payload?.roomId || typeof payload.roomId !== "string") {
          callback({ message: "Room ID is required" });
          return;
        }

        const userId = socket.data.userId;
        const displayName = socket.data.displayName;

        let room = roomService.getRoom(payload.roomId);

        if (!room) {
          const scheduledHost = await resolveScheduledHostUserId(
            payload.scheduledMeetingId
          );
          if (!scheduledHost) {
            callback({ message: "Room not found" });
            return;
          }
          room = roomService.createRoomWithId(payload.roomId);
          room.hostUserId = scheduledHost;
        }

        if (room.hostUserId === userId) {
          roomService.approveSocket(payload.roomId, socket.id);
          callback({ roomId: payload.roomId, state: "pending-approval" });
          socket.emit("join-approved", { roomId: payload.roomId });
          return;
        }

        socket.data.rooms.add(payload.roomId);

        const hostPresent = roomService.getHostSocketIds(payload.roomId).length > 0;

        if (!hostPresent) {
          roomService.addWaitingSocket(payload.roomId, socket.id);
          callback({ roomId: payload.roomId, state: "waiting-for-host" });
          if (room.hostUserId) {
            notifyHostJoinRequestMissed(
              room.hostUserId,
              payload.roomId,
              displayName,
              room.meetingId ?? undefined
            ).catch((e) =>
              console.error("[Notify] missed-lobby failed:", e)
            );
          }
          return;
        }

        const req = roomService.addPendingRequest(payload.roomId, socket.id, userId, displayName);
        if (!req) {
          callback({ message: "Failed to register join request" });
          return;
        }

        notifyHostsOfPending(
          io,
          payload.roomId,
          socket.id,
          userId,
          displayName,
          req.requestedAt.toISOString()
        );

        callback({ roomId: payload.roomId, state: "pending-approval" });
      } catch (err) {
        console.error("[request-join] failed:", err);
        callback({ message: "Failed to request join" });
      }
    });

    socket.on("cancel-join-request", (payload, callback) => {
      try {
        if (!payload?.roomId || typeof payload.roomId !== "string") {
          callback({ message: "Room ID is required" });
          return;
        }

        roomService.removePendingRequest(payload.roomId, socket.id);
        roomService.removeWaitingSocket(payload.roomId, socket.id);
        socket.data.rooms.delete(payload.roomId);
        notifyHostsOfCancellation(io, payload.roomId, socket.id);
        callback({ cancelled: true });
      } catch {
        callback({ message: "Failed to cancel join request" });
      }
    });

    socket.on("approve-join-request", (payload, callback) => {
      try {
        if (!payload?.roomId || !payload?.socketId) {
          callback({ message: "Invalid payload" });
          return;
        }

        const room = roomService.getRoom(payload.roomId);
        if (!room) {
          callback({ message: "Room not found" });
          return;
        }
        if (room.hostUserId !== socket.data.userId) {
          callback({ message: "Only the host can approve requests" });
          return;
        }

        const removed = roomService.removePendingRequest(payload.roomId, payload.socketId);
        if (!removed) {
          callback({ message: "Request not found" });
          return;
        }

        roomService.approveSocket(payload.roomId, payload.socketId);
        // Remember the approval by userId so a refresh (new socket) rejoins
        // directly instead of having to request again.
        roomService.approveUser(payload.roomId, removed.userId);
        notifyHostsOfCancellation(io, payload.roomId, payload.socketId);
        io.to(payload.socketId).emit("join-approved", { roomId: payload.roomId });
        callback({ approved: true });
      } catch {
        callback({ message: "Failed to approve request" });
      }
    });

    socket.on("deny-join-request", (payload, callback) => {
      try {
        if (!payload?.roomId || !payload?.socketId) {
          callback({ message: "Invalid payload" });
          return;
        }

        const room = roomService.getRoom(payload.roomId);
        if (!room) {
          callback({ message: "Room not found" });
          return;
        }
        if (room.hostUserId !== socket.data.userId) {
          callback({ message: "Only the host can deny requests" });
          return;
        }

        const removed = roomService.removePendingRequest(payload.roomId, payload.socketId);
        if (!removed) {
          callback({ message: "Request not found" });
          return;
        }

        notifyHostsOfCancellation(io, payload.roomId, payload.socketId);
        io.to(payload.socketId).emit("join-denied", {
          roomId: payload.roomId,
          reason: "Host denied your request to join",
        });
        callback({ denied: true });
      } catch {
        callback({ message: "Failed to deny request" });
      }
    });

    socket.on("leave-room", async (payload) => {
      if (!payload?.roomId) return;

      // Explicit leave overrides any in-flight grace teardown.
      cancelRoomCleanup(payload.roomId);

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
        const wasPending = roomService.removePendingRequest(roomId, socket.id);
        const wasWaiting = (() => {
          const r = roomService.getRoom(roomId);
          if (r?.waitingSockets.has(socket.id)) {
            r.waitingSockets.delete(socket.id);
            return true;
          }
          return false;
        })();

        if (wasPending || wasWaiting) {
          notifyHostsOfCancellation(io, roomId, socket.id);
        }

        const room = roomService.getRoom(roomId);
        if (!room) continue;

        const wasParticipant = room.participants.has(socket.id);
        if (!wasParticipant) continue;

        const meetingId = room.meetingId;
        const isLastParticipant = room.participants.size === 1
          && room.participants.has(socket.id);

        let removed;
        try {
          removed = roomService.removeParticipant(roomId, socket.id);
        } catch (err) {
          console.error(`[Room] removeParticipant threw for ${roomId}:`, err);
          removed = room.participants.get(socket.id);
          room.participants.delete(socket.id);
          room.peerMedia.delete(socket.id);
        }

        if (removed) {
          // Unlike "leave-room", a disconnect is treated as a possible refresh
          // / transient drop. We defer the meeting teardown with a grace
          // window so a reconnecting user (especially a solo host) doesn't end
          // the meeting and trigger the transcription pipeline prematurely.
          if (meetingId && isLastParticipant) {
            scheduleRoomCleanup(roomId, meetingId);
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
