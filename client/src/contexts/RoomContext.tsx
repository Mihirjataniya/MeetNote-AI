import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { useSocket } from "../hooks/useSocket";
import type { TypedSocket } from "../hooks/useSocket";
import { useMediasoup } from "../hooks/useMediasoup";
import { useRecorder } from "../hooks/useRecorder";
import { uploadRecording } from "../services/recordings";
import { isError } from "../types/index";
import type {
  ParticipantInfo,
  RoomCreatedPayload,
  PeerJoinedPayload,
  PeerLeftPayload,
} from "../types/index";

interface RoomState {
  roomId: string | null;
  meetingId: string | null;
  participants: ParticipantInfo[];
  connected: boolean;
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  remoteScreenStreams: Map<string, MediaStream>;
  screenStream: MediaStream | null;
  error: string | null;
  socketId: string | null;
}

interface RoomActions {
  createRoom: () => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  clearMeetingId: () => void;
  startMedia: () => void;
  muteTrack: (kind: "audio" | "video", muted: boolean) => void;
  startScreenShare: () => void;
  stopScreenShare: () => void;
}

export type RoomContextValue = RoomState & RoomActions;

// eslint-disable-next-line react-refresh/only-export-components
export const RoomContext = createContext<RoomContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useRoom(): RoomContextValue {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error("useRoom must be used within RoomProvider");
  return ctx;
}

export function RoomProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const { getSocket, connected, connect, disconnect } = useSocket(token);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  const socket: TypedSocket | null = useMemo(
    () => (connected ? getSocket() : null),
    [connected, getSocket]
  );

  const socketId = useMemo(() => socket?.id ?? null, [socket]);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  const {
    localStream,
    remoteStreams,
    remoteScreenStreams,
    screenStream,
    startProducing,
    muteTrack,
    startScreenShare: startScreenShareFn,
    stopScreenShare,
    close,
  } = useMediasoup(socket, roomId);

  const { startRecording, stopRecording } = useRecorder();

  useEffect(() => {
    if (!socket) return;

    const handlePeerJoined = (payload: PeerJoinedPayload) => {
      setParticipants((prev) => [...prev, payload.peer]);
    };

    const handlePeerLeft = (payload: PeerLeftPayload) => {
      setParticipants((prev) =>
        prev.filter((p) => p.socketId !== payload.socketId)
      );
    };

    socket.on("peer-joined", handlePeerJoined);
    socket.on("peer-left", handlePeerLeft);

    return () => {
      socket.off("peer-joined", handlePeerJoined);
      socket.off("peer-left", handlePeerLeft);
    };
  }, [socket]);

  useEffect(() => {
    if (localStream) startRecording(localStream);
  }, [localStream, startRecording]);

  const createRoom = useCallback(() => {
    if (!socket?.connected) return;
    setError(null);

    socket.emit("create-room", {}, (response) => {
      if (isError(response)) {
        setError(response.message);
        return;
      }
      const res = response as RoomCreatedPayload;
      setRoomId(res.roomId);
      setMeetingId(res.meetingId);
      setParticipants(res.participants);
    });
  }, [socket]);

  const joinRoom = useCallback(
    (id: string) => {
      if (!socket?.connected) return;
      setError(null);

      socket.emit("join-room", { roomId: id }, (response) => {
        if (isError(response)) {
          setError(response.message);
          return;
        }
        const res = response as RoomCreatedPayload;
        setRoomId(res.roomId);
        setMeetingId(res.meetingId);
        setParticipants(res.participants);
      });
    },
    [socket]
  );

  const leaveRoom = useCallback(async () => {
    const currentRoomId = roomId;
    const currentSocket = socket;

    const blob = await stopRecording();
    if (blob && currentRoomId) {
      try {
        await uploadRecording(currentRoomId, blob);
      } catch (err) {
        console.error("[Recording] Upload failed:", err);
      }
    }

    if (currentRoomId && currentSocket) {
      close();
      currentSocket.emit("leave-room", { roomId: currentRoomId });
    }
    setRoomId(null);
    setParticipants([]);
    setError(null);
  }, [roomId, socket, close, stopRecording]);

  const clearMeetingId = useCallback(() => {
    setMeetingId(null);
  }, []);

  const startMedia = useCallback(() => {
    setError(null);
    startProducing().catch((err: Error) => setError(err.message));
  }, [startProducing]);

  const startScreenShare = useCallback(() => {
    setError(null);
    startScreenShareFn().catch((err: Error) => setError(err.message));
  }, [startScreenShareFn]);

  return (
    <RoomContext.Provider
      value={{
        roomId,
        meetingId,
        participants,
        connected,
        localStream,
        remoteStreams,
        remoteScreenStreams,
        screenStream,
        error,
        socketId,
        createRoom,
        joinRoom,
        leaveRoom,
        clearMeetingId,
        startMedia,
        muteTrack,
        startScreenShare,
        stopScreenShare,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}
