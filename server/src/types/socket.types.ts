import type {
  RtpCapabilities,
  RtpParameters,
  DtlsParameters,
  MediaKind,
} from "mediasoup/types";
import type { ParticipantInfo } from "./room.types";

// --- Room event payloads ---

export interface CreateRoomPayload {
  title?: string;
  agenda?: string;
}

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
  meetingId: string | null;
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

// --- MediaSoup signaling payloads ---

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

export interface GetProducersPayload {
  roomId: string;
}

export interface ExistingProducer {
  producerId: string;
  producerSocketId: string;
  kind: MediaKind;
  appData?: Record<string, unknown>;
}

export interface ExistingProducersResponse {
  producers: ExistingProducer[];
}

export interface NewProducerPayload {
  roomId: string;
  producerId: string;
  producerSocketId: string;
  kind: MediaKind;
  appData?: Record<string, unknown>;
}

export interface ProducerClosedPayload {
  roomId: string;
  producerId: string;
  producerSocketId: string;
}

// --- Notification payloads ---

export interface TranscriptReadyPayload {
  meetingId: string;
  status: "completed" | "failed";
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
  produce: (
    payload: ProducePayload,
    callback: (response: ProducedResponse | ErrorPayload) => void
  ) => void;
  consume: (
    payload: ConsumePayload,
    callback: (response: ConsumedResponse | ErrorPayload) => void
  ) => void;
  "resume-consumer": (
    payload: ResumeConsumerPayload,
    callback: (response: { resumed: true } | ErrorPayload) => void
  ) => void;
  "get-producers": (
    payload: GetProducersPayload,
    callback: (response: ExistingProducersResponse | ErrorPayload) => void
  ) => void;
  "close-producer": (
    payload: { roomId: string; producerId: string },
    callback: (response: { closed: true } | ErrorPayload) => void
  ) => void;
  "pause-producer": (
    payload: { roomId: string; producerId: string },
    callback: (response: { paused: true } | ErrorPayload) => void
  ) => void;
  "resume-producer": (
    payload: { roomId: string; producerId: string },
    callback: (response: { resumed: true } | ErrorPayload) => void
  ) => void;
}

export interface ServerToClientEvents {
  "peer-joined": (payload: PeerJoinedPayload) => void;
  "peer-left": (payload: PeerLeftPayload) => void;
  "new-producer": (payload: NewProducerPayload) => void;
  "producer-closed": (payload: ProducerClosedPayload) => void;
  "transcript-ready": (payload: TranscriptReadyPayload) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  userId: string;
  displayName: string;
  email: string;
  rooms: Set<string>;
}
