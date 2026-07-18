import { useState, useEffect, useCallback, useRef } from "react";
import { useRoomStore } from "../stores/useRoomStore";
import { useSocketStore } from "../stores/useSocketStore";
import { useAuthStore } from "../stores/useAuthStore";
import { LocalVideo } from "./LocalVideo";
import { RemoteVideo } from "./RemoteVideo";
import { Icon } from "./shell/Icon";
import { Avatar } from "./shell/Avatar";
import { ChatPanel } from "./ChatPanel";
import type { PeerMediaState } from "../hooks/useMediasoup";

export interface RoomProps {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  remoteScreenStreams: Map<string, MediaStream>;
  remoteMediaState: Map<string, PeerMediaState>;
  screenStream: MediaStream | null;
  startMedia: () => void;
  muteTrack: (kind: "audio" | "video", muted: boolean) => void;
  startScreenShare: () => void;
  stopScreenShare: () => void;
  leaveRoom: () => void | Promise<void>;
}

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

export function Room({
  localStream,
  remoteStreams,
  remoteScreenStreams,
  remoteMediaState,
  screenStream,
  startMedia,
  muteTrack,
  startScreenShare,
  stopScreenShare,
  leaveRoom,
}: RoomProps) {
  const user = useAuthStore((s) => s.user);
  const roomId = useRoomStore((s) => s.roomId);
  const participants = useRoomStore((s) => s.participants);
  const pendingRequests = useRoomStore((s) => s.pendingRequests);
  const isHost = useRoomStore((s) => s.isHost);
  const approveJoinRequest = useRoomStore((s) => s.approveJoinRequest);
  const denyJoinRequest = useRoomStore((s) => s.denyJoinRequest);
  const error = useRoomStore((s) => s.error);
  const socket = useSocketStore((s) => s.socket);
  const socketId = socket?.id ?? null;
  const pendingCount = isHost ? pendingRequests.length : 0;

  // Seed the control state from the device choices made in the lobby so the
  // UI (and the LocalVideo avatar/black-frame swap) matches the actual track
  // enabled-state that MeetingPage applies. Starting these at `true`
  // unconditionally left a muted-in-lobby user showing a stuck black tile.
  const preferredMicOn = useRoomStore((s) => s.preferredMicOn);
  const preferredCamOn = useRoomStore((s) => s.preferredCamOn);
  const [micOn, setMicOn] = useState(preferredMicOn);
  const [camOn, setCamOn] = useState(preferredCamOn);
  const [leaving, setLeaving] = useState(false);

  const handleToggleCam = useCallback(() => {
    if (!localStream) {
      startMedia();
      return;
    }
    const next = !camOn;
    localStream.getVideoTracks().forEach((t) => {
      t.enabled = next;
    });
    muteTrack("video", !next);
    setCamOn(next);
  }, [localStream, camOn, startMedia, muteTrack]);

  const handleToggleScreen = useCallback(() => {
    if (screenStream) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
  }, [screenStream, startScreenShare, stopScreenShare]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const [dockEdge, setDockEdge] = useState<"top" | "bottom" | "left" | "right">("bottom");
  const barRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ active: false, moved: false, startX: 0, startY: 0, pointerId: -1 });

  useEffect(() => {
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    startMedia();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMic = useCallback(() => {
    if (localStream) {
      const next = !micOn;
      localStream.getAudioTracks().forEach((t) => {
        t.enabled = next;
      });
      muteTrack("audio", !next);
      setMicOn(next);
    }
  }, [localStream, micOn, muteTrack]);


  const toggleParticipants = useCallback(() => {
    setShowParticipants((p) => {
      if (!p) setShowChat(false);
      return !p;
    });
  }, []);

  const toggleChat = useCallback(() => {
    setShowChat((p) => {
      if (!p) {
        setShowParticipants(false);
        setUnreadCount(0);
      }
      return !p;
    });
  }, []);

  const showChatRef = useRef(showChat);
  showChatRef.current = showChat;

  useEffect(() => {
    if (!socket) return;
    const handler = () => {
      if (!showChatRef.current) setUnreadCount((c) => c + 1);
    };
    socket.on("chat-message", handler);
    return () => { socket.off("chat-message", handler); };
  }, [socket]);

  const copyRoomId = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLeave = async () => {
    if (leaving) return;
    setLeaving(true);
    try {
      await leaveRoom();
    } catch {
      // Leave failed (e.g. final chunk upload) — re-enable so user can retry.
      setLeaving(false);
    }
    // On success the room unmounts, so no need to reset `leaving`.
  };

  const isVertical = dockEdge === "left" || dockEdge === "right";
  const DRAG_THRESHOLD = 6;

  const onBarPointerDown = useCallback((e: React.PointerEvent) => {
    dragRef.current = { active: true, moved: false, startX: e.clientX, startY: e.clientY, pointerId: e.pointerId };
  }, []);

  const onBarPointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d.active || !barRef.current) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved) {
      if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
      d.moved = true;
      barRef.current.setPointerCapture(d.pointerId);
    }
    barRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
    barRef.current.style.transition = "none";
  }, []);

  const onBarPointerUp = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d.active || !barRef.current) return;
    d.active = false;
    barRef.current.style.transform = "";
    barRef.current.style.transition = "";
    if (!d.moved) return;

    const { innerWidth: w, innerHeight: h } = window;
    const x = e.clientX;
    const y = e.clientY;
    const edges: Record<string, number> = { top: y, bottom: h - y, left: x, right: w - x };
    const nearest = Object.entries(edges).sort((a, b) => a[1] - b[1])[0][0] as typeof dockEdge;
    setDockEdge(nearest);
  }, []);

  const onBarClickCapture = useCallback((e: React.MouseEvent) => {
    if (dragRef.current.moved) {
      e.stopPropagation();
      dragRef.current.moved = false;
    }
  }, []);

  const dockClass = {
    bottom: "bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2",
    top: "top-4 left-1/2 -translate-x-1/2",
    left: "left-4 top-1/2 -translate-y-1/2",
    right: "right-4 top-1/2 -translate-y-1/2",
  }[dockEdge];

  const peerLookup = new Map(
    participants.map((p) => [p.socketId, p.displayName])
  );

  const supportsScreenShare = !!navigator.mediaDevices?.getDisplayMedia;
  const remoteScreenEntries = Array.from(remoteScreenStreams.entries());
  const spotlightStream = screenStream ?? remoteScreenEntries[0]?.[1] ?? null;
  const spotlightLabel = screenStream
    ? "Your screen"
    : peerLookup.get(remoteScreenEntries[0]?.[0]) ?? "Screen share";

  const streamCount = (localStream ? 1 : 0) + remoteStreams.size;

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] text-white relative overflow-hidden">
      {/* ── Top bar ── */}
      <header className="h-12 sm:h-14 px-4 sm:px-6 flex items-center gap-2.5 sm:gap-4 shrink-0 relative z-10">
        <span className="inline-flex items-center gap-2 font-semibold text-[14px] tracking-[-0.02em] text-white">
          <span className="w-[22px] h-[22px] rounded-[6px] bg-white text-[#111] inline-flex items-center justify-center font-display text-[12px] font-bold shrink-0">
            M
          </span>
          <span className="hidden sm:inline">MeetNote Ai</span>
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
          onClick={toggleParticipants}
          className="relative flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-[12px] text-white/50 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
        >
          <Icon name="users" size={13} />
          {participants.length}
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#facc15] text-[#111] text-[10px] font-bold inline-flex items-center justify-center pointer-events-none">
              {pendingCount > 9 ? "9+" : pendingCount}
            </span>
          )}
        </button>
      </header>

      {/* Error banner */}
      {error && (
        <div className="mx-4 sm:mx-6 mt-1 text-[13px] text-[#fca5a5] bg-[#dc2626]/10 border border-[#dc2626]/20 rounded-[10px] px-3 py-2.5 shrink-0">
          {error}
        </div>
      )}

      {/* ── Content row (video + chat sidebar on desktop) ── */}
      <div className="flex-1 flex min-h-0">
        {/* Video area */}
        <div
          className={`flex-1 p-3 sm:p-4 min-h-0 min-w-0 ${
            spotlightStream || streamCount > 0 ? "" : "flex items-center justify-center"
          }`}
        >
          {spotlightStream ? (
            /* ── Spotlight layout — screen share only, no camera strip ── */
            <div className="h-full">
              <ScreenTile stream={spotlightStream} label={spotlightLabel} />
            </div>
          ) : streamCount > 0 ? (
            /* ── Grid layout ── */
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
              {Array.from(remoteStreams.entries()).map(([peerId, stream]) => {
                const ms = remoteMediaState.get(peerId);
                return (
                  <RemoteVideo
                    key={peerId}
                    stream={stream}
                    displayName={peerLookup.get(peerId) ?? peerId.slice(0, 8)}
                    audioMuted={ms?.audioMuted ?? false}
                    videoMuted={ms?.videoMuted ?? false}
                  />
                );
              })}
            </div>
          ) : (
            /* ── Empty state ── */
            <div className="flex flex-col items-center justify-center text-center px-4">
              <div className="w-20 h-20 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-5">
                <Icon name="video" size={32} className="text-white/20" />
              </div>
              <p className="text-[16px] text-white/60 font-medium">Ready to go</p>
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

        {/* Desktop chat sidebar — inside the content row */}
        {showChat && roomId && (
          <div className="hidden sm:block w-[330px] shrink-0 p-2 pl-0">
            <ChatPanel roomId={roomId} onClose={() => setShowChat(false)} />
          </div>
        )}
      </div>

      {/* ── Floating control bar — draggable, edge-snapping ── */}
      <div
        ref={barRef}
        className={`absolute z-10 transition-all duration-300 ease-out ${dockClass}`}
        onPointerDown={onBarPointerDown}
        onPointerMove={onBarPointerMove}
        onPointerUp={onBarPointerUp}
        onClickCapture={onBarClickCapture}
        style={{ touchAction: "none" }}
      >
        <div className={`flex ${isVertical ? "flex-col" : "items-center"} gap-1.5 sm:gap-2.5 ${isVertical ? "px-2 sm:px-3 py-2.5 sm:py-4" : "px-2.5 sm:px-4 py-2 sm:py-3"} rounded-2xl bg-white/[0.08] backdrop-blur-md border border-white/[0.08]`}>
          {/* Drag handle */}
          <div className="flex items-center justify-center cursor-grab active:cursor-grabbing text-white/25 hover:text-white/40 transition-colors">
            <Icon name="grip" size={14} style={isVertical ? { transform: "rotate(90deg)" } : undefined} />
          </div>

          <div className={isVertical ? "h-px w-7 bg-white/[0.1] mx-auto" : "w-px h-7 bg-white/[0.1] mx-0.5 sm:mx-1"} />

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
            icon={localStream ? (camOn ? "video" : "videoOff") : "video"}
            active={localStream ? !camOn : false}
            onClick={handleToggleCam}
            title={localStream ? (camOn ? "Turn off camera" : "Turn on camera") : "Start camera"}
          />

          {/* Screen share */}
          <ControlButton
            icon={screenStream ? "screenShareOff" : "screenShare"}
            active={!!screenStream}
            disabled={!supportsScreenShare}
            onClick={handleToggleScreen}
            title={supportsScreenShare ? (screenStream ? "Stop sharing" : "Share screen") : "Screen sharing not supported on this device"}
          />

          <div className={isVertical ? "h-px w-7 bg-white/[0.1] mx-auto" : "w-px h-7 bg-white/[0.1] mx-0.5 sm:mx-1 hidden xs:block"} />

          {/* Participants */}
          <div className="relative">
            <ControlButton
              icon="users"
              highlight={showParticipants}
              onClick={toggleParticipants}
              title="Participants"
            />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#facc15] text-[#111] text-[10px] font-bold inline-flex items-center justify-center pointer-events-none">
                {pendingCount > 9 ? "9+" : pendingCount}
              </span>
            )}
          </div>

          {/* Chat */}
          <div className="relative">
            <ControlButton
              icon="chat"
              highlight={showChat}
              onClick={toggleChat}
              title="Chat"
            />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold inline-flex items-center justify-center pointer-events-none">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>

          {/* Copy link — mobile only */}
          {!isVertical && (
            <ControlButton
              icon={copied ? "check" : "link"}
              onClick={copyRoomId}
              title="Copy room ID"
              className="sm:hidden"
            />
          )}

          <div className={isVertical ? "h-px w-7 bg-white/[0.1] mx-auto" : "w-px h-7 bg-white/[0.1] mx-0.5 sm:mx-1"} />

          {/* Leave */}
          <button
            onClick={handleLeave}
            disabled={leaving}
            title={leaving ? "Leaving…" : "Leave"}
            className={`${isVertical ? "w-10 h-10 sm:w-11 sm:h-11" : "h-10 sm:h-11 px-3.5 sm:px-5"} rounded-full bg-[#dc2626] hover:bg-[#b91c1c] text-white font-medium text-[13px] inline-flex items-center justify-center gap-2 transition-colors active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100`}
          >
            {leaving ? (
              <Icon name="spinner" size={16} className="animate-spin" />
            ) : (
              <Icon name="phone" size={16} style={{ transform: "rotate(135deg)" }} />
            )}
            {!isVertical && (
              <span className="hidden sm:inline">{leaving ? "Leaving…" : "Leave"}</span>
            )}
          </button>
        </div>
      </div>

      {/* ── Participants panel ── */}
      {showParticipants && (
        <div className="absolute inset-0 z-20 flex justify-end">
          <div className="absolute inset-0 bg-black/30 sm:bg-transparent" />
          <div
            className="relative w-[280px] sm:w-[300px] h-full bg-[#111] border-l border-white/[0.08] flex flex-col shadow-2xl"
            style={{ animation: "slide-in-right 0.2s ease" }}
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
              {isHost && pendingRequests.length > 0 && (
                <div className="mb-3">
                  <div className="px-3 mb-1.5 text-[10.5px] uppercase tracking-[0.08em] font-medium text-[#facc15]">
                    Waiting to join ({pendingRequests.length})
                  </div>
                  <div className="flex flex-col gap-1">
                    {pendingRequests.map((r) => (
                      <div
                        key={r.socketId}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]"
                      >
                        <Avatar name={r.displayName} size={32} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-medium text-white truncate">
                            {r.displayName}
                          </div>
                          <div className="text-[11px] text-white/40 mt-0.5">
                            Wants to join
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => denyJoinRequest(r.socketId)}
                            title="Deny"
                            className="w-7 h-7 rounded-lg inline-flex items-center justify-center text-white/55 hover:text-white hover:bg-[#dc2626]/20 transition-colors"
                          >
                            <Icon name="x" size={13} />
                          </button>
                          <button
                            onClick={() => approveJoinRequest(r.socketId)}
                            title="Admit"
                            className="h-7 px-2.5 rounded-lg bg-white text-[#111] text-[12px] font-semibold inline-flex items-center gap-1 hover:bg-white/90 transition-colors"
                          >
                            <Icon name="check" size={11} /> Admit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="h-px bg-white/[0.06] mt-3" />
                </div>
              )}
              <div className="flex flex-col gap-0.5">
                {participants.map((p) => (
                  <div
                    key={p.socketId}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors"
                  >
                    <Avatar name={p.displayName} size={32} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-white truncate flex items-center gap-1.5">
                        <span className="truncate">{p.displayName}</span>
                        {p.socketId === socketId && (
                          <span className="text-[11px] text-white/30 font-normal">
                            (you)
                          </span>
                        )}
                        {p.role === "host" && (
                          <span className="px-1.5 py-[1px] rounded text-[9.5px] uppercase tracking-[0.06em] font-semibold bg-[#facc15]/15 text-[#facc15]">
                            Host
                          </span>
                        )}
                      </div>
                    </div>
                    <Icon name="mic" size={13} className="text-white/25 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
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

      {/* ── Chat panel — mobile floating ── */}
      {showChat && roomId && (
        <div className="sm:hidden">
          <ChatPanel
            roomId={roomId}
            onClose={() => setShowChat(false)}
          />
        </div>
      )}
    </div>
  );
}

/* ── Screen share spotlight tile ── */

function ScreenTile({ stream, label }: { stream: MediaStream; label: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    video.play().catch(() => {});
  }, [stream]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden bg-[#111] border border-white/[0.06]">
      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain" />
      <div className="absolute bottom-2.5 left-2.5 pointer-events-none">
        <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-sm text-[12px] font-medium text-white flex items-center gap-1.5">
          <Icon name="screenShare" size={11} />
          {label}
        </span>
      </div>
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
