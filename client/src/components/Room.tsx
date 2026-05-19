import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useRoom } from "../contexts/RoomContext";
import { useAuth } from "../contexts/AuthContext";
import { LocalVideo } from "./LocalVideo";
import { RemoteVideo } from "./RemoteVideo";
import { Icon } from "./shell/Icon";
import { Avatar } from "./shell/Avatar";

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function getGridClass(count: number): string {
  if (count <= 1) return "grid-cols-1 max-w-2xl";
  if (count <= 2) return "grid-cols-1 sm:grid-cols-2 max-w-4xl";
  if (count <= 4) return "grid-cols-2 max-w-5xl";
  return "grid-cols-2 sm:grid-cols-3 max-w-6xl";
}

export function Room() {
  const { user } = useAuth();
  const {
    roomId,
    participants,
    localStream,
    remoteStreams,
    error,
    leaveRoom,
    startMedia,
    socketId,
  } = useRoom();
  const navigate = useNavigate();

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  const [copied, setCopied] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleMic = useCallback(() => {
    if (localStream) {
      const next = !micOn;
      localStream.getAudioTracks().forEach((t) => {
        t.enabled = next;
      });
      setMicOn(next);
    }
  }, [localStream, micOn]);

  const toggleCam = useCallback(() => {
    if (localStream) {
      const next = !camOn;
      localStream.getVideoTracks().forEach((t) => {
        t.enabled = next;
      });
      setCamOn(next);
    }
  }, [localStream, camOn]);

  const copyRoomId = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLeave = () => {
    leaveRoom();
    navigate("/home");
  };

  const peerLookup = new Map(
    participants.map((p) => [p.socketId, p.displayName])
  );

  const streamCount = (localStream ? 1 : 0) + remoteStreams.size;

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] text-white relative overflow-hidden">
      {/* ── Top bar ── */}
      <header className="h-12 sm:h-14 px-4 sm:px-6 flex items-center gap-2.5 sm:gap-4 shrink-0 relative z-10">
        <span className="inline-flex items-center gap-2 font-semibold text-[14px] tracking-[-0.02em] text-white">
          <span className="w-[22px] h-[22px] rounded-[6px] bg-white text-[#111] inline-flex items-center justify-center font-display text-[12px] font-bold shrink-0">
            M
          </span>
          <span className="hidden sm:inline">MeetNote</span>
        </span>

        <div className="h-5 w-px bg-white/[0.1] hidden sm:block" />

        {/* Recording indicator */}
        <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full bg-[#dc2626]/15 border border-[#dc2626]/20">
          <span className="w-2 h-2 rounded-full bg-[#ef4444] animate-pulse" />
          <span className="text-[10px] sm:text-[11px] font-medium text-[#fca5a5] uppercase tracking-[0.04em]">
            Rec
          </span>
        </div>

        {/* Timer */}
        <span className="text-[12px] sm:text-[13px] font-mono text-white/50 tabular-nums">
          {formatElapsed(elapsed)}
        </span>

        <div className="flex-1" />

        {/* Room ID — desktop */}
        <button
          onClick={copyRoomId}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-mono text-white/50 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
          title="Copy room ID"
        >
          <Icon name={copied ? "check" : "link"} size={12} />
          {roomId?.slice(0, 8)}…
          {copied && (
            <span className="text-[10px] text-[#4ade80] font-sans font-medium">
              Copied
            </span>
          )}
        </button>

        {/* Participant count */}
        <button
          onClick={() => setShowParticipants((p) => !p)}
          className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-[12px] text-white/50 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
        >
          <Icon name="users" size={13} />
          {participants.length}
        </button>
      </header>

      {/* Error banner */}
      {error && (
        <div className="mx-4 sm:mx-6 mt-1 text-[13px] text-[#fca5a5] bg-[#dc2626]/10 border border-[#dc2626]/20 rounded-[10px] px-3 py-2.5 shrink-0">
          {error}
        </div>
      )}

      {/* ── Video grid area ── */}
      <div
        className={`flex-1 p-3 sm:p-4 min-h-0 ${
          streamCount > 0 ? "" : "flex items-center justify-center"
        }`}
      >
        {streamCount > 0 ? (
          <div
            className={`grid ${getGridClass(streamCount)} gap-2.5 sm:gap-3 w-full mx-auto h-full auto-rows-fr`}
          >
            {localStream && (
              <LocalVideo
                stream={localStream}
                micOn={micOn}
                camOn={camOn}
                displayName={user?.displayName ?? "You"}
              />
            )}
            {Array.from(remoteStreams.entries()).map(([peerId, stream]) => (
              <RemoteVideo
                key={peerId}
                stream={stream}
                displayName={peerLookup.get(peerId) ?? peerId.slice(0, 8)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center px-4">
            <div className="w-20 h-20 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-5">
              <Icon name="video" size={32} className="text-white/20" />
            </div>
            <p className="text-[16px] text-white/60 font-medium">
              Ready to go
            </p>
            <p className="text-[13px] text-white/30 mt-1.5 max-w-[280px]">
              Turn on your camera and microphone to start the meeting
            </p>
            <button
              onClick={startMedia}
              className="mt-6 h-11 px-6 rounded-xl bg-white text-[#111] font-medium text-[14px] inline-flex items-center gap-2.5 hover:bg-white/90 transition-colors active:scale-[0.98]"
            >
              <Icon name="video" size={14} /> Start Camera & Mic
            </button>
          </div>
        )}
      </div>

      {/* ── Bottom control bar ── */}
      <div className="pb-4 sm:pb-6 px-4 flex items-center justify-center shrink-0 relative z-10">
        <div className="flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-4 py-2 sm:py-3 rounded-2xl bg-white/[0.08] backdrop-blur-md border border-white/[0.08]">
          {/* Mic */}
          <ControlButton
            icon={micOn ? "mic" : "micOff"}
            active={!micOn}
            disabled={!localStream}
            onClick={toggleMic}
            title={micOn ? "Mute microphone" : "Unmute microphone"}
          />

          {/* Camera */}
          <ControlButton
            icon={camOn ? "video" : "videoOff"}
            active={!camOn}
            disabled={!localStream}
            onClick={toggleCam}
            title={camOn ? "Turn off camera" : "Turn on camera"}
          />

          <div className="w-px h-7 bg-white/[0.1] mx-0.5 sm:mx-1 hidden xs:block" />

          {/* Participants */}
          <ControlButton
            icon="users"
            highlight={showParticipants}
            onClick={() => setShowParticipants((p) => !p)}
            title="Participants"
          />

          {/* Copy link — mobile only */}
          <ControlButton
            icon={copied ? "check" : "link"}
            onClick={copyRoomId}
            title="Copy room ID"
            className="sm:hidden"
          />

          <div className="w-px h-7 bg-white/[0.1] mx-0.5 sm:mx-1" />

          {/* Leave */}
          <button
            onClick={handleLeave}
            className="h-10 sm:h-11 px-3.5 sm:px-5 rounded-full bg-[#dc2626] hover:bg-[#b91c1c] text-white font-medium text-[13px] inline-flex items-center gap-2 transition-colors active:scale-95"
          >
            <Icon name="phone" size={16} style={{ transform: "rotate(135deg)" }} />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      </div>

      {/* ── Participants panel ── */}
      {showParticipants && (
        <div
          className="absolute inset-0 z-20 flex justify-end"
          onClick={() => setShowParticipants(false)}
        >
          {/* Backdrop — visible on mobile */}
          <div className="absolute inset-0 bg-black/30 sm:bg-transparent" />

          {/* Panel */}
          <div
            className="relative w-[280px] sm:w-[300px] h-full bg-[#111] border-l border-white/[0.08] flex flex-col shadow-2xl"
            style={{ animation: "slide-in-right 0.2s ease" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-4 flex items-center justify-between border-b border-white/[0.08] shrink-0">
              <h3 className="text-[14px] font-semibold text-white">
                Participants ({participants.length})
              </h3>
              <button
                onClick={() => setShowParticipants(false)}
                className="w-7 h-7 rounded-lg inline-flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
              >
                <Icon name="x" size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              <div className="flex flex-col gap-0.5">
                {participants.map((p) => (
                  <div
                    key={p.socketId}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors"
                  >
                    <Avatar name={p.displayName} size={32} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-white truncate">
                        {p.displayName}
                        {p.socketId === socketId && (
                          <span className="text-[11px] text-white/30 font-normal ml-1.5">
                            (you)
                          </span>
                        )}
                      </div>
                    </div>
                    <Icon name="mic" size={13} className="text-white/25 shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            {/* Invite link */}
            <div className="p-3 border-t border-white/[0.08] shrink-0">
              <button
                onClick={copyRoomId}
                className="w-full h-9 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-[13px] font-medium text-white/70 inline-flex items-center justify-center gap-2 transition-colors"
              >
                <Icon name="link" size={13} />
                {copied ? "Copied!" : "Copy invite link"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Reusable control button ── */

interface ControlButtonProps {
  icon: string;
  active?: boolean;
  highlight?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  className?: string;
}

function ControlButton({
  icon,
  active,
  highlight,
  disabled,
  onClick,
  title,
  className = "",
}: ControlButtonProps) {
  let bg = "bg-white/[0.1] hover:bg-white/[0.15] text-white";
  if (active) bg = "bg-[#dc2626] hover:bg-[#b91c1c] text-white";
  else if (highlight) bg = "bg-white/[0.18] hover:bg-white/[0.22] text-white";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full inline-flex items-center justify-center transition-all duration-150 active:scale-95 disabled:opacity-30 disabled:cursor-default ${bg} ${className}`}
    >
      <Icon name={icon} size={18} />
    </button>
  );
}
