import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/useAuthStore";
import { useRoomStore } from "../stores/useRoomStore";
import { useSocketStore } from "../stores/useSocketStore";
import { getUserPreferences } from "../services/userPreferences";
import { Icon } from "./shell/Icon";
import { Avatar } from "./shell/Avatar";

export interface MeetingLobbyProps {
  roomId: string;
  scheduledMeetingId?: string;
  isHost: boolean;
  onJoin: () => void;
}

export function MeetingLobby({
  roomId,
  scheduledMeetingId,
  isHost,
  onJoin,
}: MeetingLobbyProps) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const connected = useSocketStore((s) => s.connected);
  const requestState = useRoomStore((s) => s.requestState);
  const requestError = useRoomStore((s) => s.requestError);
  const requestJoin = useRoomStore((s) => s.requestJoin);
  const cancelJoinRequest = useRoomStore((s) => s.cancelJoinRequest);
  const setPreferredDevices = useRoomStore((s) => s.setPreferredDevices);
  const setRequestState = useRoomStore((s) => s.setRequestState);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Honor per-device defaults from Settings → Meeting Preferences.
  const [micOn, setMicOn] = useState(() => getUserPreferences().defaultMicOn);
  const [camOn, setCamOn] = useState(() => getUserPreferences().defaultCamOn);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setMediaError("Camera and microphone require HTTPS or localhost.");
        setCamOn(false);
        setMicOn(false);
        setInitializing(false);
        return;
      }

      const tryGetMedia = async (
        constraints: MediaStreamConstraints
      ): Promise<MediaStream | null> => {
        try {
          return await navigator.mediaDevices.getUserMedia(constraints);
        } catch {
          return null;
        }
      };

      let stream = await tryGetMedia({ audio: true, video: true });
      let camFailed = false;
      let micFailed = false;

      if (!stream) {
        stream = await tryGetMedia({ audio: true, video: false });
        camFailed = true;
      }
      if (!stream) {
        stream = await tryGetMedia({ audio: false, video: true });
        camFailed = false;
        micFailed = true;
      }

      if (cancelled) {
        stream?.getTracks().forEach((t) => t.stop());
        return;
      }

      if (!stream) {
        setMediaError(
          "Camera and microphone are unavailable. You can still join, but others won't see or hear you."
        );
        setCamOn(false);
        setMicOn(false);
        setInitializing(false);
        return;
      }

      if (camFailed) {
        setMediaError("Camera unavailable. Joining without video , you can still talk.");
        setCamOn(false);
      } else if (micFailed) {
        setMediaError("Microphone unavailable. Joining without audio.");
        setMicOn(false);
      }

      streamRef.current = stream;
      // Apply user's pref to freshly-acquired tracks (track.enabled defaults to true).
      stream.getAudioTracks().forEach((t) => {
        t.enabled = micOn && !micFailed;
      });
      stream.getVideoTracks().forEach((t) => {
        t.enabled = camOn && !camFailed;
      });
      if (videoRef.current && stream.getVideoTracks().length > 0) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setInitializing(false);
    })();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  const toggleMic = useCallback(() => {
    const stream = streamRef.current;
    const tracks = stream?.getAudioTracks() ?? [];
    if (tracks.length === 0) return;
    const next = !micOn;
    tracks.forEach((t) => {
      t.enabled = next;
    });
    setMicOn(next);
  }, [micOn]);

  const toggleCam = useCallback(() => {
    const stream = streamRef.current;
    const tracks = stream?.getVideoTracks() ?? [];
    if (tracks.length === 0) return;
    const next = !camOn;
    tracks.forEach((t) => {
      t.enabled = next;
    });
    setCamOn(next);
  }, [camOn]);

  const proceedToRoom = useCallback(() => {
    setPreferredDevices(micOn, camOn);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    onJoin();
  }, [micOn, camOn, setPreferredDevices, onJoin]);

  useEffect(() => {
    if (requestState === "approved") {
      proceedToRoom();
    }
  }, [requestState, proceedToRoom]);

  const handlePrimaryAction = () => {
    setPreferredDevices(micOn, camOn);
    if (isHost) {
      proceedToRoom();
      return;
    }
    requestJoin(roomId, scheduledMeetingId ? { scheduledMeetingId } : undefined);
  };

  const handleCancel = () => {
    if (requestState === "pending-approval" || requestState === "waiting-for-host") {
      cancelJoinRequest(roomId);
    }
    setRequestState("idle");
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    navigate("/home");
  };

  const showRequestingState =
    !isHost &&
    (requestState === "pending-approval" ||
      requestState === "waiting-for-host");
  const showDeniedState = !isHost && requestState === "denied";
  const showErrorState = !isHost && requestState === "error";

  const primaryDisabled =
    !connected || initializing || showRequestingState;

  return (
    <div className="h-full w-full flex items-center justify-center bg-[#0a0a0a] text-white px-4 py-6">
      <div className="w-full max-w-[920px] grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Preview tile */}
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#111] border border-white/[0.06] shadow-[0_20px_40px_rgba(0,0,0,0.25)]">
          {camOn && !mediaError ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Avatar name={user?.displayName ?? "You"} size={88} />
              <p className="text-[14px] text-white/55">
                {mediaError ? "Camera unavailable" : "Camera is off"}
              </p>
            </div>
          )}

          {initializing && !mediaError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="w-9 h-9 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          )}

          {/* Name pill */}
          <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-black/50 backdrop-blur-sm text-[12px] font-medium text-white">
            {user?.displayName ?? "You"}
          </div>

          {/* Device toggles */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
            <button
              onClick={toggleMic}
              disabled={!streamRef.current?.getAudioTracks().length}
              title={micOn ? "Mute microphone" : "Unmute microphone"}
              className={`w-10 h-10 rounded-full inline-flex items-center justify-center transition-colors active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                micOn
                  ? "bg-white/[0.12] hover:bg-white/[0.18] text-white"
                  : "bg-[#dc2626] hover:bg-[#b91c1c] text-white"
              }`}
            >
              <Icon name={micOn ? "mic" : "micOff"} size={16} />
            </button>
            <button
              onClick={toggleCam}
              disabled={!streamRef.current?.getVideoTracks().length}
              title={camOn ? "Turn off camera" : "Turn on camera"}
              className={`w-10 h-10 rounded-full inline-flex items-center justify-center transition-colors active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                camOn
                  ? "bg-white/[0.12] hover:bg-white/[0.18] text-white"
                  : "bg-[#dc2626] hover:bg-[#b91c1c] text-white"
              }`}
            >
              <Icon name={camOn ? "video" : "videoOff"} size={16} />
            </button>
          </div>
        </div>

        {/* Side panel */}
        <div className="flex flex-col gap-4">
          <div>
            <span className="inline-flex items-center gap-2 font-semibold text-[14px] tracking-[-0.02em] text-white">
              <span className="w-[22px] h-[22px] rounded-[6px] bg-white text-[#111] inline-flex items-center justify-center font-display text-[12px] font-bold">
                M
              </span>
              MeetNote Ai
            </span>
            <h1 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em] font-display mt-5 text-white leading-tight">
              {isHost ? "Ready to start?" : "Ready to join?"}
            </h1>
            <p className="text-[13px] text-white/55 mt-2 leading-relaxed">
              {isHost
                ? "Check your camera and mic, then start the meeting."
                : "Check your camera and mic. The host will admit you from the meeting."}
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
            <div className="text-[10.5px] uppercase tracking-[0.08em] font-medium text-white/40">
              Meeting room
            </div>
            <div className="font-mono text-[13px] text-white/85 mt-1 truncate">
              {roomId}
            </div>
          </div>

          {/* Connection state */}
          <div className="flex items-center gap-2 text-[12px]">
            <span
              className={`w-2 h-2 rounded-full ${
                connected
                  ? "bg-[#4ade80] shadow-[0_0_0_3px_rgba(74,222,128,0.15)]"
                  : "bg-white/30 animate-pulse"
              }`}
            />
            <span className="text-white/60">
              {connected ? "Connected to server" : "Connecting…"}
            </span>
          </div>

          {/* Status banners */}
          {mediaError && (
            <div className="text-[12.5px] text-[#fca5a5] bg-[#dc2626]/10 border border-[#dc2626]/20 rounded-lg px-3 py-2.5">
              {mediaError}
            </div>
          )}

          {showRequestingState && (
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5">
              <div className="flex items-center gap-2 text-[13px] text-white/85 font-medium">
                <span className="w-2 h-2 rounded-full bg-[#facc15] animate-pulse" />
                {requestState === "waiting-for-host"
                  ? "Waiting for the host to join…"
                  : "Waiting for the host to admit you…"}
              </div>
              <p className="text-[12px] text-white/45 mt-1.5">
                {requestState === "waiting-for-host"
                  ? "We'll send your request once the host starts the meeting."
                  : "The host has been notified and will respond shortly."}
              </p>
            </div>
          )}

          {showDeniedState && (
            <div className="text-[12.5px] text-[#fca5a5] bg-[#dc2626]/10 border border-[#dc2626]/20 rounded-lg px-3 py-2.5">
              {requestError ?? "The host denied your request to join."}
            </div>
          )}

          {showErrorState && (
            <div className="text-[12.5px] text-[#fca5a5] bg-[#dc2626]/10 border border-[#dc2626]/20 rounded-lg px-3 py-2.5">
              {requestError ?? "Failed to send join request."}
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col gap-2 mt-1">
            <button
              onClick={handlePrimaryAction}
              disabled={primaryDisabled}
              className="h-11 rounded-[10px] bg-white text-[#111] font-medium text-[14px] inline-flex items-center justify-center gap-2 hover:bg-white/90 transition-colors active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Icon name={isHost ? "play" : "video"} size={13} />
              {isHost
                ? "Start meeting"
                : showRequestingState
                ? "Request sent"
                : showDeniedState
                ? "Request denied"
                : "Request to join"}
            </button>
            <button
              onClick={handleCancel}
              className="h-11 rounded-[10px] bg-transparent text-white/80 font-medium text-[14px] inline-flex items-center justify-center gap-2 border border-white/[0.14] hover:bg-white/[0.06] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
