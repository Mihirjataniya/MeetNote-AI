import { useEffect, useRef, useCallback, useState } from "react";
import { useParams, useNavigate, useSearchParams, useLocation, Link } from "react-router-dom";
import { useRoomStore, getActiveRoomSession } from "../stores/useRoomStore";
import { invalidateMeetings } from "../queries/useMeetingsQuery";
import { useSocketStore } from "../stores/useSocketStore";
import { useMediasoup } from "../hooks/useMediasoup";
import { useRecorder } from "../hooks/useRecorder";
import { uploadChunk } from "../services/recordings";
import { Room } from "../components/Room";
import { MeetingLobby } from "../components/MeetingLobby";
import { Icon } from "../components/shell/Icon";

function MeetingContent() {
  const { roomId: urlRoomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const scheduledMeetingId = searchParams.get("scheduledMeetingId") ?? undefined;
  const [asHostQuery, setAsHostQuery] = useState(
    () => searchParams.get("host") === "1"
  );
  const isNewRoom = urlRoomId === "new";
  const locationState = (location.state ?? {}) as {
    title?: string;
    agenda?: string;
  };

  const socket = useSocketStore((s) => s.socket);
  const connected = useSocketStore((s) => s.connected);

  const roomId = useRoomStore((s) => s.roomId);
  const meetingId = useRoomStore((s) => s.meetingId);
  const error = useRoomStore((s) => s.error);
  const preferredMicOn = useRoomStore((s) => s.preferredMicOn);
  const preferredCamOn = useRoomStore((s) => s.preferredCamOn);
  const createRoom = useRoomStore((s) => s.createRoom);
  const joinRoom = useRoomStore((s) => s.joinRoom);
  const requestJoin = useRoomStore((s) => s.requestJoin);
  const setError = useRoomStore((s) => s.setError);
  const clearMeetingId = useRoomStore((s) => s.clearMeetingId);

  const {
    localStream,
    remoteStreams,
    remoteScreenStreams,
    remoteMediaState,
    screenStream,
    startProducing,
    muteTrack,
    startScreenShare,
    stopScreenShare,
    close,
  } = useMediasoup(socket, roomId);

  const { startRecording, stopRecording, flushChunk } = useRecorder();

  const flushIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lobbyJoinTriggered = useRef(false);
  const initialDevicePrefsApplied = useRef(false);
  const autoRejoinTried = useRef(false);

  // Set up peer-joined/peer-left/lobby listeners
  useEffect(() => {
    return useRoomStore.getState().setupSocketListeners();
  }, [socket]);

  // Auto-rejoin after a refresh: if this tab was already in this room, skip the
  // lobby and rejoin directly. The server keeps membership/approval for a short
  // grace window, so this lands the user straight back in the meeting.
  useEffect(() => {
    if (autoRejoinTried.current) return;
    if (isNewRoom || !urlRoomId || roomId) return;
    if (!connected || !socket) return;
    if (getActiveRoomSession() !== urlRoomId) return;
    autoRejoinTried.current = true;
    joinRoom(urlRoomId, scheduledMeetingId ? { scheduledMeetingId } : undefined);
  }, [connected, socket, urlRoomId, isNewRoom, roomId, scheduledMeetingId, joinRoom]);

  // If the auto-rejoin failed (grace window elapsed / meeting ended), fall back
  // to the normal lobby flow instead of showing a hard error. One-shot: only
  // swallows the auto-rejoin's own error, not later lobby errors.
  const autoRejoinFellBack = useRef(false);
  useEffect(() => {
    if (
      autoRejoinTried.current &&
      !autoRejoinFellBack.current &&
      error &&
      !roomId
    ) {
      autoRejoinFellBack.current = true;
      setError(null);
    }
  }, [error, roomId, setError]);

  // Auto-start recording when local stream is available
  useEffect(() => {
    if (localStream) startRecording(localStream);
  }, [localStream, startRecording]);

  // Apply mic/cam preferences chosen in lobby to the actual room stream
  useEffect(() => {
    if (!localStream || initialDevicePrefsApplied.current) return;
    initialDevicePrefsApplied.current = true;
    if (!preferredMicOn) {
      localStream.getAudioTracks().forEach((t) => {
        t.enabled = false;
      });
      muteTrack("audio", true);
    }
    if (!preferredCamOn) {
      localStream.getVideoTracks().forEach((t) => {
        t.enabled = false;
      });
      muteTrack("video", true);
    }
  }, [localStream, preferredMicOn, preferredCamOn, muteTrack]);

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

  // Redirect from /room/new to /room/:actualRoomId
  useEffect(() => {
    if (isNewRoom && roomId) {
      navigate(`/room/${roomId}`, { replace: true });
    }
  }, [isNewRoom, roomId, navigate]);

  // Strip ?host=1 from the URL bar once — it's only a UI hint.
  // The asHostQuery state above already captured the initial value, so the
  // lobby keeps showing the host UI without leaking the hint to a copied URL.
  useEffect(() => {
    if (searchParams.get("host") !== "1") return;
    if (isNewRoom) return;
    const next = new URLSearchParams(searchParams);
    next.delete("host");
    const qs = next.toString();
    navigate(`/room/${urlRoomId}${qs ? `?${qs}` : ""}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redirect home after leaving. Refetch meetings so the just-ended meeting
  // shows up with its current transcript/notes status (then live socket
  // events keep it updating without a manual refresh).
  useEffect(() => {
    if (!roomId && meetingId) {
      const timer = setTimeout(() => {
        clearMeetingId();
        invalidateMeetings();
        navigate("/home");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [roomId, meetingId, clearMeetingId, navigate]);

  const handleLobbyJoin = useCallback(() => {
    if (lobbyJoinTriggered.current) return;
    lobbyJoinTriggered.current = true;

    if (isNewRoom) {
      createRoom({ title: locationState.title, agenda: locationState.agenda });
    } else if (urlRoomId) {
      joinRoom(urlRoomId, scheduledMeetingId ? { scheduledMeetingId } : undefined);
    }
  }, [isNewRoom, urlRoomId, scheduledMeetingId, createRoom, joinRoom, locationState.title, locationState.agenda]);

  // Reset trigger if joinRoom failed so user can try again
  useEffect(() => {
    if (lobbyJoinTriggered.current && !roomId && error) {
      lobbyJoinTriggered.current = false;
    }
  }, [roomId, error]);

  // Recover from a stale ?host=1 hint: if we optimistically tried to join as
  // host but the server rejects with "Approval required", silently downgrade
  // to the request-to-join flow instead of leaving the user stuck on an error.
  useEffect(() => {
    if (
      asHostQuery &&
      !isNewRoom &&
      urlRoomId &&
      error === "Approval required to join this meeting"
    ) {
      setAsHostQuery(false);
      setError(null);
      lobbyJoinTriggered.current = false;
      requestJoin(
        urlRoomId,
        scheduledMeetingId ? { scheduledMeetingId } : undefined
      );
    }
  }, [error, asHostQuery, isNewRoom, urlRoomId, scheduledMeetingId, requestJoin, setError]);

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
        remoteMediaState={remoteMediaState}
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
              invalidateMeetings();
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

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#0a0a0a] text-white px-4">
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
      </div>
    );
  }

  if (!urlRoomId) {
    return null;
  }

  if (!connected) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#0a0a0a] text-white px-4">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-5" />
          <p className="text-[15px] text-white/70 font-medium">
            Connecting to server…
          </p>
        </div>
      </div>
    );
  }

  return (
    <MeetingLobby
      roomId={urlRoomId}
      scheduledMeetingId={scheduledMeetingId}
      isHost={isNewRoom || asHostQuery}
      onJoin={handleLobbyJoin}
    />
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
