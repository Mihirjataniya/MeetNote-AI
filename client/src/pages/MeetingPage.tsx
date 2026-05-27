import { useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useRoomStore } from "../stores/useRoomStore";
import { useSocketStore } from "../stores/useSocketStore";
import { useMediasoup } from "../hooks/useMediasoup";
import { useRecorder } from "../hooks/useRecorder";
import { uploadChunk } from "../services/recordings";
import { Room } from "../components/Room";
import { Icon } from "../components/shell/Icon";

function MeetingContent() {
  const { roomId: urlRoomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const socket = useSocketStore((s) => s.socket);
  const connected = useSocketStore((s) => s.connected);

  const roomId = useRoomStore((s) => s.roomId);
  const meetingId = useRoomStore((s) => s.meetingId);
  const error = useRoomStore((s) => s.error);
  const createRoom = useRoomStore((s) => s.createRoom);
  const joinRoom = useRoomStore((s) => s.joinRoom);
  const clearMeetingId = useRoomStore((s) => s.clearMeetingId);

  const {
    localStream,
    remoteStreams,
    remoteScreenStreams,
    screenStream,
    startProducing,
    muteTrack,
    startScreenShare,
    stopScreenShare,
    close,
  } = useMediasoup(socket, roomId);

  const { startRecording, stopRecording, flushChunk } = useRecorder();

  const initiated = useRef(false);
  const flushIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Set up peer-joined/peer-left listeners
  useEffect(() => {
    return useRoomStore.getState().setupSocketListeners();
  }, [socket]);

  // Auto-start recording when local stream is available
  useEffect(() => {
    if (localStream) startRecording(localStream);
  }, [localStream, startRecording]);

  // Periodically flush and upload audio chunks (every 3 minutes)
  useEffect(() => {
    if (!localStream || !roomId) return;

    const CHUNK_INTERVAL_MS = 3 * 60 * 1000;

    flushIntervalRef.current = setInterval(async () => {
      const chunk = await flushChunk();
      if (chunk) {
        uploadChunk(roomId, chunk.blob, chunk.chunkIndex, chunk.chunkStartMs, false).catch(
          (err) => console.error("[Recording] Chunk upload failed:", err)
        );
      }
    }, CHUNK_INTERVAL_MS);

    return () => {
      if (flushIntervalRef.current) clearInterval(flushIntervalRef.current);
    };
  }, [localStream, roomId, flushChunk]);

  // Create or join room when connected
  useEffect(() => {
    if (!connected || initiated.current || !urlRoomId) return;
    initiated.current = true;

    if (urlRoomId === "new") {
      createRoom();
    } else {
      joinRoom(urlRoomId);
    }
  }, [connected, urlRoomId, createRoom, joinRoom]);

  // Redirect from /room/new to /room/:actualRoomId
  useEffect(() => {
    if (urlRoomId === "new" && roomId) {
      navigate(`/room/${roomId}`, { replace: true });
    }
  }, [urlRoomId, roomId, navigate]);

  // Redirect home after leaving
  useEffect(() => {
    if (!roomId && meetingId) {
      const timer = setTimeout(() => {
        clearMeetingId();
        navigate("/home");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [roomId, meetingId, clearMeetingId, navigate]);

  const handleLeaveRoom = useCallback(async () => {
    if (flushIntervalRef.current) clearInterval(flushIntervalRef.current);
    const currentRoomId = useRoomStore.getState().roomId;
    const result = await stopRecording();
    if (result && currentRoomId) {
      try {
        await uploadChunk(
          currentRoomId,
          result.blob,
          result.chunkIndex,
          result.chunkStartMs,
          true
        );
      } catch (err) {
        console.error("[Recording] Final chunk upload failed:", err);
      }
    }
    close();
    useRoomStore.getState().leaveRoom();
  }, [stopRecording, close]);

  const handleStartMedia = useCallback(() => {
    useRoomStore.getState().setError(null);
    startProducing().catch((err: Error) =>
      useRoomStore.getState().setError(err.message)
    );
  }, [startProducing]);

  const handleStartScreenShare = useCallback(() => {
    useRoomStore.getState().setError(null);
    startScreenShare().catch((err: Error) =>
      useRoomStore.getState().setError(err.message)
    );
  }, [startScreenShare]);

  if (roomId)
    return (
      <Room
        localStream={localStream}
        remoteStreams={remoteStreams}
        remoteScreenStreams={remoteScreenStreams}
        screenStream={screenStream}
        startMedia={handleStartMedia}
        muteTrack={muteTrack}
        startScreenShare={handleStartScreenShare}
        stopScreenShare={stopScreenShare}
        leaveRoom={handleLeaveRoom}
      />
    );

  if (meetingId) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#0a0a0a] text-white">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center mx-auto mb-4">
            <Icon name="check" size={24} className="text-[#4ade80]" />
          </div>
          <p className="text-[16px] font-medium text-white/90 mb-2">
            You left the meeting
          </p>
          <p className="text-[13px] text-white/40 leading-relaxed">
            The transcript will appear on your dashboard once processing completes.
          </p>
          <button
            onClick={() => {
              clearMeetingId();
              navigate("/home");
            }}
            className="mt-5 inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-white/[0.08] text-white/70 text-[13px] font-medium hover:bg-white/[0.12] transition-colors"
          >
            <Icon name="home" size={13} /> Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center bg-[#0a0a0a] text-white px-4">
      {error ? (
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-[#dc2626]/10 border border-[#dc2626]/20 flex items-center justify-center mx-auto mb-4">
            <Icon name="x" size={24} className="text-[#fca5a5]" />
          </div>
          <p className="text-[15px] text-[#fca5a5] font-medium mb-2">
            Could not join room
          </p>
          <p className="text-[13px] text-white/40 mb-6">{error}</p>
          <Link
            to="/home"
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-white text-[#111] text-[13px] font-medium hover:bg-white/90 transition-colors no-underline"
          >
            <Icon name="home" size={13} /> Back to dashboard
          </Link>
        </div>
      ) : (
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-5" />
          <p className="text-[15px] text-white/70 font-medium">
            {connected
              ? urlRoomId === "new"
                ? "Creating room…"
                : "Joining room…"
              : "Connecting to server…"}
          </p>
        </div>
      )}
    </div>
  );
}

export function MeetingPage() {
  useEffect(() => {
    return () => {
      useRoomStore.getState().reset();
    };
  }, []);

  return <MeetingContent />;
}
