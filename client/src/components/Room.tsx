import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRoom } from "../contexts/RoomContext";
import { LocalVideo } from "./LocalVideo";
import { RemoteVideo } from "./RemoteVideo";
import { Icon } from "./shell/Icon";
import { Avatar } from "./shell/Avatar";

export function Room() {
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
  const [copied, setCopied] = useState(false);

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
  const gridCols =
    streamCount <= 1 ? "grid-cols-1 max-w-[640px] mx-auto" : streamCount <= 4 ? "grid-cols-2" : "grid-cols-3";

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] text-white">
      <header className="h-14 px-6 flex items-center gap-4 border-b border-white/[0.08] shrink-0">
        <span className="inline-flex items-center gap-[9px] font-semibold text-[15px] tracking-[-0.02em] text-white">
          <span className="w-[22px] h-[22px] rounded-[6px] bg-white text-[#111] inline-flex items-center justify-center font-display text-[13px] font-bold">
            M
          </span>
          MeetNote
        </span>

        <div className="h-5 w-px bg-white/[0.12] mx-1" />

        <button
          onClick={copyRoomId}
          className="flex items-center gap-2 px-2.5 py-1 rounded-lg text-[12px] font-mono text-white/60 hover:text-white/80 hover:bg-white/[0.06] transition-colors"
          title="Click to copy room ID"
        >
          <Icon name="link" size={12} />
          {roomId?.slice(0, 8)}...
          {copied && (
            <span className="text-[11px] text-[#4ade80] font-sans font-medium ml-1">Copied!</span>
          )}
        </button>

        <div className="flex items-center gap-1.5 text-[12px] text-white/50 ml-2">
          <Icon name="users" size={13} />
          {participants.length}
        </div>

        <div className="flex-1" />

        {!localStream && (
          <button
            onClick={startMedia}
            className="h-8 px-3 rounded-lg bg-white text-[#111] font-medium text-[13px] inline-flex items-center gap-1.5 hover:bg-white/90 transition-colors active:scale-[0.98]"
          >
            <Icon name="video" size={12} /> Start Camera/Mic
          </button>
        )}

        <button
          onClick={handleLeave}
          className="h-8 px-3 rounded-lg bg-[#dc2626] text-white font-medium text-[13px] inline-flex items-center gap-1.5 hover:bg-[#b91c1c] transition-colors active:scale-[0.98]"
        >
          Leave
        </button>
      </header>

      {error && (
        <div className="mx-6 mt-3 text-[13px] text-[#fca5a5] bg-[#dc2626]/10 border border-[#dc2626]/20 rounded-[10px] px-3 py-2.5">
          {error}
        </div>
      )}

      <div className="flex-1 p-4 min-h-0">
        {streamCount > 0 ? (
          <div className={`grid ${gridCols} gap-3 h-full auto-rows-fr`}>
            {localStream && <LocalVideo stream={localStream} />}
            {Array.from(remoteStreams.entries()).map(([peerId, stream]) => (
              <RemoteVideo
                key={peerId}
                stream={stream}
                displayName={peerLookup.get(peerId) ?? peerId.slice(0, 8)}
              />
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center mb-4">
              <Icon name="video" size={28} className="text-white/30" />
            </div>
            <p className="text-[15px] text-white/50 font-medium">No video yet</p>
            <p className="text-[13px] text-white/30 mt-1">
              Click "Start Camera/Mic" to begin
            </p>
          </div>
        )}
      </div>

      <div className="px-6 py-3 border-t border-white/[0.08] flex items-center gap-3 shrink-0">
        <span className="text-[12px] font-medium text-white/40 uppercase tracking-[0.06em]">
          Participants ({participants.length})
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          {participants.map((p) => (
            <div
              key={p.socketId}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/[0.06] text-[12px] text-white/70"
            >
              <Avatar name={p.displayName} size={18} />
              {p.displayName}
              {p.socketId === socketId && (
                <span className="text-[10px] text-white/40">(you)</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
