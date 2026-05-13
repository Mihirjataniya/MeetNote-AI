export interface ServerConfig {
  port: number;
  nodeEnv: string;
}

// --- Domain types ---

export interface Participant {
  socketId: string;
  displayName: string;
  joinedAt: Date;
}

export interface Room {
  roomId: string;
  participants: Map<string, Participant>;
  createdAt: Date;
}

export interface ParticipantInfo {
  socketId: string;
  displayName: string;
  joinedAt: string;
}

// --- Socket.IO payload types ---

export interface CreateRoomPayload {
  displayName: string;
}

export interface JoinRoomPayload {
  roomId: string;
  displayName: string;
}

export interface LeaveRoomPayload {
  roomId: string;
}

export interface GetParticipantsPayload {
  roomId: string;
}

export interface RoomCreatedPayload {
  roomId: string;
  participants: ParticipantInfo[];
}

export interface PeerJoinedPayload {
  roomId: string;
  peer: ParticipantInfo;
}

export interface PeerLeftPayload {
  roomId: string;
  socketId: string;
  displayName: string;
}

export interface ParticipantsListPayload {
  roomId: string;
  participants: ParticipantInfo[];
}

export interface ErrorPayload {
  message: string;
}

// --- Socket.IO typed event maps ---

export interface ClientToServerEvents {
  "create-room": (
    payload: CreateRoomPayload,
    callback: (response: RoomCreatedPayload | ErrorPayload) => void
  ) => void;
  "join-room": (
    payload: JoinRoomPayload,
    callback: (response: RoomCreatedPayload | ErrorPayload) => void
  ) => void;
  "leave-room": (payload: LeaveRoomPayload) => void;
  "get-participants": (
    payload: GetParticipantsPayload,
    callback: (response: ParticipantsListPayload | ErrorPayload) => void
  ) => void;
}

export interface ServerToClientEvents {
  "peer-joined": (payload: PeerJoinedPayload) => void;
  "peer-left": (payload: PeerLeftPayload) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  displayName: string;
  rooms: Set<string>;
}
