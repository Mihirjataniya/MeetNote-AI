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

export interface CreateRoomPayload {
  title?: string;
  agenda?: string;
  scheduledMeetingId?: string;
}

export interface JoinRoomPayload {
  roomId: string;
  scheduledMeetingId?: string;
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
  meetingId: string | null;
  participants: ParticipantInfo[];
  isHost: boolean;
  pendingRequests: PendingRequestInfo[];
}

export interface RequestJoinPayload {
  roomId: string;
  scheduledMeetingId?: string;
}

export interface CancelJoinRequestPayload {
  roomId: string;
}

export interface ApproveJoinRequestPayload {
  roomId: string;
  socketId: string;
}

export interface DenyJoinRequestPayload {
  roomId: string;
  socketId: string;
}

export interface RequestJoinAckPayload {
  roomId: string;
  state: "waiting-for-host" | "pending-approval";
}

export interface JoinRequestedPayload {
  roomId: string;
  request: PendingRequestInfo;
}

export interface JoinRequestCancelledPayload {
  roomId: string;
  socketId: string;
}

export interface JoinApprovedPayload {
  roomId: string;
}

export interface JoinDeniedPayload {
  roomId: string;
  reason?: string;
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

// Broadcast when a peer pauses/resumes a producer (mic mute, camera off) so
// this client can render a muted-mic badge / camera-off avatar on that peer's
// tile instead of showing silence / a frozen frame with no indication.
export interface ProducerPausedPayload {
  roomId: string;
  producerId: string;
  producerSocketId: string;
  kind: MediaKind;
  paused: boolean;
}

export interface SendMessagePayload {
  roomId: string;
  text: string;
}

export interface ChatMessagePayload {
  id: string;
  userId: string;
  displayName: string;
  text: string;
  createdAt: string;
}

export interface TranscriptReadyPayload {
  meetingId: string;
  status: "processing" | "completed" | "failed";
}

export interface NotesReadyPayload {
  meetingId: string;
  status: "generating" | "completed" | "failed";
}

export type MeetingStateChangeKind =
  | "created"
  | "updated"
  | "cancelled"
  | "series-cancelled"
  | "started";

export interface MeetingStateChangedPayload {
  meetingId: string;
  kind: MeetingStateChangeKind;
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
  "send-message": (
    payload: SendMessagePayload,
    callback: (response: { messageId: string } | ErrorPayload) => void
  ) => void;
  "request-join": (
    payload: RequestJoinPayload,
    callback: (response: RequestJoinAckPayload | ErrorPayload) => void
  ) => void;
  "cancel-join-request": (
    payload: CancelJoinRequestPayload,
    callback: (response: { cancelled: true } | ErrorPayload) => void
  ) => void;
  "approve-join-request": (
    payload: ApproveJoinRequestPayload,
    callback: (response: { approved: true } | ErrorPayload) => void
  ) => void;
  "deny-join-request": (
    payload: DenyJoinRequestPayload,
    callback: (response: { denied: true } | ErrorPayload) => void
  ) => void;
}

export interface ServerToClientEvents {
  "peer-joined": (payload: PeerJoinedPayload) => void;
  "peer-left": (payload: PeerLeftPayload) => void;
  "new-producer": (payload: NewProducerPayload) => void;
  "producer-closed": (payload: ProducerClosedPayload) => void;
  "producer-paused": (payload: ProducerPausedPayload) => void;
  "transcript-ready": (payload: TranscriptReadyPayload) => void;
  "notes-ready": (payload: NotesReadyPayload) => void;
  "chat-message": (payload: ChatMessagePayload) => void;
  "meeting-state-changed": (payload: MeetingStateChangedPayload) => void;
  "join-requested": (payload: JoinRequestedPayload) => void;
  "join-request-cancelled": (payload: JoinRequestCancelledPayload) => void;
  "join-approved": (payload: JoinApprovedPayload) => void;
  "join-denied": (payload: JoinDeniedPayload) => void;
  "notification:new": (payload: NotificationSocketPayload) => void;
}

export interface NotificationSocketPayload {
  id: string;
  type: string;
  title: string;
  body?: string;
  meetingId?: string;
  roomId?: string;
  requesterName?: string;
  readAt: string | null;
  createdAt: string;
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
    !("resumed" in response) &&
    !("paused" in response) &&
    !("closed" in response) &&
    !("messageId" in response)
  );
}
