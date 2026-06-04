import crypto from "node:crypto";
import { Room, Participant, ParticipantInfo, PeerMedia } from "../types/index";

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
      participants: new Map(),
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

  addParticipant(
    roomId: string,
    socketId: string,
    displayName: string
  ): Participant | undefined {
    const room = this.rooms.get(roomId);
    if (!room) return undefined;

    const participant: Participant = {
      socketId,
      displayName,
      joinedAt: new Date(),
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

    if (room.participants.size === 0) {
      room.router?.close();
      room.router = null;
    }

    return participant;
  }

  getParticipants(roomId: string): ParticipantInfo[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];

    return Array.from(room.participants.values()).map((p) => ({
      socketId: p.socketId,
      displayName: p.displayName,
      joinedAt: p.joinedAt.toISOString(),
    }));
  }

  getRoomCount(): number {
    return this.rooms.size;
  }
}

export const roomService = new RoomService();
