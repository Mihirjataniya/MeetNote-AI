import crypto from "node:crypto";
import {
  Room,
  Participant,
  ParticipantInfo,
  PeerMedia,
  PendingJoinRequest,
  PendingRequestInfo,
} from "../types/index";

class RoomService {
  private rooms: Map<string, Room> = new Map();

  createRoom(): Room {
    return this.createRoomWithId(crypto.randomUUID());
  }

  createRoomWithId(roomId: string): Room {
    const existing = this.rooms.get(roomId);
    if (existing) return existing;
    const room: Room = {
      roomId,
      meetingId: null,
      hostUserId: null,
      participants: new Map(),
      pendingRequests: new Map(),
      waitingSockets: new Set(),
      approvedSockets: new Set(),
      approvedUserIds: new Set(),
      createdAt: new Date(),
      router: null,
      peerMedia: new Map(),
    };
    this.rooms.set(roomId, room);
    return room;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  setHost(roomId: string, userId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    if (!room.hostUserId) room.hostUserId = userId;
  }

  isHost(roomId: string, userId: string): boolean {
    const room = this.rooms.get(roomId);
    return !!room && room.hostUserId === userId;
  }

  addParticipant(
    roomId: string,
    socketId: string,
    userId: string,
    displayName: string
  ): Participant | undefined {
    const room = this.rooms.get(roomId);
    if (!room) return undefined;

    const role: "host" | "participant" =
      room.hostUserId === userId ? "host" : "participant";

    const participant: Participant = {
      socketId,
      userId,
      displayName,
      joinedAt: new Date(),
      role,
    };
    room.participants.set(socketId, participant);
    return participant;
  }

  cleanupPeerMedia(roomId: string, socketId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const media = room.peerMedia.get(socketId);
    if (!media) return;

    for (const consumer of media.consumers.values()) {
      consumer.close();
    }
    for (const producer of media.producers.values()) {
      producer.close();
    }
    media.sendTransport?.close();
    media.recvTransport?.close();

    room.peerMedia.delete(socketId);
  }

  removeParticipant(
    roomId: string,
    socketId: string
  ): Participant | undefined {
    const room = this.rooms.get(roomId);
    if (!room) return undefined;

    const participant = room.participants.get(socketId);
    if (!participant) return undefined;

    this.cleanupPeerMedia(roomId, socketId);
    room.participants.delete(socketId);

    if (room.participants.size === 0 && room.pendingRequests.size === 0 && room.waitingSockets.size === 0) {
      room.router?.close();
      room.router = null;
    }

    return participant;
  }

  approveSocket(roomId: string, socketId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.approvedSockets.add(socketId);
  }

  consumeApproval(roomId: string, socketId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    return room.approvedSockets.delete(socketId);
  }

  isApproved(roomId: string, socketId: string): boolean {
    const room = this.rooms.get(roomId);
    return !!room && room.approvedSockets.has(socketId);
  }

  // userId-scoped approval — survives socket reconnects (refresh).
  approveUser(roomId: string, userId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.approvedUserIds.add(userId);
  }

  isUserApproved(roomId: string, userId: string): boolean {
    const room = this.rooms.get(roomId);
    return !!room && room.approvedUserIds.has(userId);
  }

  getParticipants(roomId: string): ParticipantInfo[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];

    return Array.from(room.participants.values()).map((p) => ({
      socketId: p.socketId,
      userId: p.userId,
      displayName: p.displayName,
      joinedAt: p.joinedAt.toISOString(),
      role: p.role,
    }));
  }

  addPendingRequest(
    roomId: string,
    socketId: string,
    userId: string,
    displayName: string
  ): PendingJoinRequest | undefined {
    const room = this.rooms.get(roomId);
    if (!room) return undefined;

    const existing = room.pendingRequests.get(socketId);
    if (existing) return existing;

    const req: PendingJoinRequest = {
      socketId,
      userId,
      displayName,
      requestedAt: new Date(),
    };
    room.pendingRequests.set(socketId, req);
    return req;
  }

  removePendingRequest(
    roomId: string,
    socketId: string
  ): PendingJoinRequest | undefined {
    const room = this.rooms.get(roomId);
    if (!room) return undefined;
    const req = room.pendingRequests.get(socketId);
    if (!req) return undefined;
    room.pendingRequests.delete(socketId);
    return req;
  }

  getPendingRequests(roomId: string): PendingRequestInfo[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    return Array.from(room.pendingRequests.values()).map((r) => ({
      socketId: r.socketId,
      userId: r.userId,
      displayName: r.displayName,
      requestedAt: r.requestedAt.toISOString(),
    }));
  }

  addWaitingSocket(roomId: string, socketId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.waitingSockets.add(socketId);
  }

  removeWaitingSocket(roomId: string, socketId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.waitingSockets.delete(socketId);
  }

  getHostSocketIds(roomId: string): string[] {
    const room = this.rooms.get(roomId);
    if (!room || !room.hostUserId) return [];
    return Array.from(room.participants.values())
      .filter((p) => p.userId === room.hostUserId)
      .map((p) => p.socketId);
  }

  deleteRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.router?.close();
    this.rooms.delete(roomId);
  }

  getRoomCount(): number {
    return this.rooms.size;
  }
}

export const roomService = new RoomService();
