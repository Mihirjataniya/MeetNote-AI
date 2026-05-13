import crypto from "node:crypto";
import { Room, Participant, ParticipantInfo } from "../types/index";

class RoomService {
  private rooms: Map<string, Room> = new Map();

  createRoom(): Room {
    const roomId = crypto.randomUUID();
    const room: Room = {
      roomId,
      participants: new Map(),
      createdAt: new Date(),
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

  removeParticipant(
    roomId: string,
    socketId: string
  ): Participant | undefined {
    const room = this.rooms.get(roomId);
    if (!room) return undefined;

    const participant = room.participants.get(socketId);
    if (!participant) return undefined;

    room.participants.delete(socketId);

    if (room.participants.size === 0) {
      this.rooms.delete(roomId);
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
