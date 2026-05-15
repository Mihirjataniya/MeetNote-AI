import type {
  RtpCapabilities,
  RtpParameters,
  DtlsParameters,
  MediaKind,
  IceParameters,
  IceCandidate,
} from "mediasoup-client/types";

export interface ParticipantInfo {
  socketId: string;
  displayName: string;
  joinedAt: string;
}

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

export interface ErrorPayload {
  message: string;
}

export interface RoomCreatedPayload {
  roomId: string;
  participants: ParticipantInfo[];
}

export interface ParticipantsListPayload {
  roomId: string;
  participants: ParticipantInfo[];
}

export interface RtpCapabilitiesResponse {
  rtpCapabilities: RtpCapabilities;
}

export interface TransportCreatedResponse {
  id: string;
  iceParameters: IceParameters;
  iceCandidates: IceCandidate[];
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

export interface PeerJoinedPayload {
  roomId: string;
  peer: ParticipantInfo;
}

export interface PeerLeftPayload {
  roomId: string;
  socketId: string;
  displayName: string;
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
    payload: { roomId: string },
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
}

export interface ServerToClientEvents {
  "peer-joined": (payload: PeerJoinedPayload) => void;
  "peer-left": (payload: PeerLeftPayload) => void;
  "new-producer": (payload: NewProducerPayload) => void;
  "producer-closed": (payload: ProducerClosedPayload) => void;
}

export function isError(response: unknown): response is ErrorPayload {
  return (
    typeof response === "object" &&
    response !== null &&
    "message" in response &&
    !("roomId" in response) &&
    !("rtpCapabilities" in response) &&
    !("id" in response) &&
    !("producerId" in response) &&
    !("consumerId" in response) &&
    !("connected" in response) &&
    !("resumed" in response)
  );
}
