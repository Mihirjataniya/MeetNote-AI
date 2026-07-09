import type {
  Transport,
  Producer,
  Consumer,
  Router,
} from "mediasoup/types";

export interface Participant {
  socketId: string;
  userId: string;
  displayName: string;
  joinedAt: Date;
  role: "host" | "participant";
}

export interface PeerMedia {
  sendTransport: Transport | null;
  recvTransport: Transport | null;
  producers: Map<string, Producer>;
  consumers: Map<string, Consumer>;
}

export interface PendingJoinRequest {
  socketId: string;
  userId: string;
  displayName: string;
  requestedAt: Date;
}

export interface Room {
  roomId: string;
  meetingId: string | null;
  hostUserId: string | null;
  participants: Map<string, Participant>;
  pendingRequests: Map<string, PendingJoinRequest>;
  waitingSockets: Set<string>;
  approvedSockets: Set<string>;
  // Approval persisted by userId so a participant who refreshes (new
  // socket.id) rejoins directly instead of being sent back to the lobby.
  approvedUserIds: Set<string>;
  createdAt: Date;
  router: Router | null;
  peerMedia: Map<string, PeerMedia>;
}

export interface ParticipantInfo {
  socketId: string;
  userId: string;
  displayName: string;
  joinedAt: string;
  role: "host" | "participant";
}

export interface PendingRequestInfo {
  socketId: string;
  userId: string;
  displayName: string;
  requestedAt: string;
}
