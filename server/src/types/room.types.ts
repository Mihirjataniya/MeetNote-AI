import type {
  Transport,
  Producer,
  Consumer,
  Router,
} from "mediasoup/types";

export interface Participant {
  socketId: string;
  displayName: string;
  joinedAt: Date;
}

export interface PeerMedia {
  sendTransport: Transport | null;
  recvTransport: Transport | null;
  producers: Map<string, Producer>;
  consumers: Map<string, Consumer>;
}

export interface Room {
  roomId: string;
  participants: Map<string, Participant>;
  createdAt: Date;
  router: Router | null;
  peerMedia: Map<string, PeerMedia>;
}

export interface ParticipantInfo {
  socketId: string;
  displayName: string;
  joinedAt: string;
}
