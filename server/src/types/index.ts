import type {
  RtpCapabilities,
  RtpParameters,
  DtlsParameters,
  MediaKind,
  Transport,
  Producer,
  Consumer,
  Router,
} from "mediasoup/types";

export interface ServerConfig {
  port: number;
  nodeEnv: string;
}

// --- Auth types ---

export interface RegisterPayload {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    displayName: string;
  };
}

export interface JwtPayload {
  userId: string;
  email: string;
  displayName: string;
}

// --- Domain types ---

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

// --- Socket.IO payload types ---

export interface CreateRoomPayload {}

export interface JoinRoomPayload {
  roomId: string;
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

// --- MediaSoup signaling payload types ---

export interface GetRtpCapabilitiesPayload {
  roomId: string;
}

export interface CreateTransportPayload {
  roomId: string;
  direction: "send" | "recv";
}

export interface ConnectTransportPayload {
  roomId: string;
  transportId: string;
  dtlsParameters: DtlsParameters;
}

export interface ProducePayload {
  roomId: string;
  transportId: string;
  kind: MediaKind;
  rtpParameters: RtpParameters;
  appData?: Record<string, unknown>;
}

export interface ConsumePayload {
  roomId: string;
  producerId: string;
  rtpCapabilities: RtpCapabilities;
}

export interface ResumeConsumerPayload {
  roomId: string;
  consumerId: string;
}

export interface RtpCapabilitiesResponse {
  rtpCapabilities: RtpCapabilities;
}

export interface TransportCreatedResponse {
  id: string;
  iceParameters: Record<string, unknown>;
  iceCandidates: Record<string, unknown>[];
  dtlsParameters: DtlsParameters;
}

export interface ProducedResponse {
  producerId: string;
}

export interface ConsumedResponse {
  consumerId: string;
  producerId: string;
  kind: MediaKind;
  rtpParameters: RtpParameters;
}

export interface NewProducerPayload {
  roomId: string;
  producerId: string;
  producerSocketId: string;
  kind: MediaKind;
}

export interface ProducerClosedPayload {
  roomId: string;
  producerId: string;
  producerSocketId: string;
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
  "get-rtp-capabilities": (
    payload: GetRtpCapabilitiesPayload,
    callback: (response: RtpCapabilitiesResponse | ErrorPayload) => void
  ) => void;
  "create-transport": (
    payload: CreateTransportPayload,
    callback: (response: TransportCreatedResponse | ErrorPayload) => void
  ) => void;
  "connect-transport": (
    payload: ConnectTransportPayload,
    callback: (response: { connected: true } | ErrorPayload) => void
  ) => void;
  "produce": (
    payload: ProducePayload,
    callback: (response: ProducedResponse | ErrorPayload) => void
  ) => void;
  "consume": (
    payload: ConsumePayload,
    callback: (response: ConsumedResponse | ErrorPayload) => void
  ) => void;
  "resume-consumer": (
    payload: ResumeConsumerPayload,
    callback: (response: { resumed: true } | ErrorPayload) => void
  ) => void;
}

export interface ServerToClientEvents {
  "peer-joined": (payload: PeerJoinedPayload) => void;
  "peer-left": (payload: PeerLeftPayload) => void;
  "new-producer": (payload: NewProducerPayload) => void;
  "producer-closed": (payload: ProducerClosedPayload) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  userId: string;
  displayName: string;
  email: string;
  rooms: Set<string>;
}
