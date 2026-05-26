import { useState } from "react";
import { Link } from "react-router-dom";
import { useRoom } from "../contexts/RoomContext";
import { Icon } from "./shell/Icon";

export function JoinForm() {
  const { connected, error, createRoom, joinRoom } = useRoom();
  const [joinRoomId, setJoinRoomId] = useState("");
  const [mode, setMode] = useState<"create" | "join">("create");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "create") {
      createRoom();
    } else {
      const id = joinRoomId.trim();
      if (!id) return;
      joinRoom(id);
    }
  };

  return (
    <div className="h-full flex items-center justify-center bg-background p-8">
      <div className="w-full max-w-[420px]">
        <Link
          to="/home"
          className="inline-flex items-center gap-[9px] font-semibold text-[15px] tracking-[-0.02em] text-foreground no-underline mb-8"
        >
          <span className="w-[22px] h-[22px] rounded-[6px] bg-accent text-accent-foreground inline-flex items-center justify-center font-display text-[13px] font-bold">
            M
          </span>
          MeetNote
        </Link>

        <h1 className="text-[28px] font-semibold tracking-tight font-display text-foreground">
          {mode === "create" ? "Start a meeting." : "Join a meeting."}
        </h1>
        <p className="mt-2 text-[14px] text-secondary">
          {mode === "create"
            ? "Create a new room and invite others to join."
            : "Enter a room ID to join an existing meeting."}
        </p>

        <div className="mt-6 flex items-center gap-2 text-[13px]">
          <span
            className={`w-2 h-2 rounded-full ${
              connected
                ? "bg-success shadow-[0_0_0_3px_rgba(22,163,74,0.15)]"
                : "bg-tertiary animate-pulse"
            }`}
          />
          <span className={connected ? "text-foreground" : "text-tertiary"}>
            {connected ? "Connected to server" : "Connecting..."}
          </span>
        </div>

        <div className="mt-5 flex gap-1 p-1 bg-surface-hover rounded-[10px]">
          <button
            type="button"
            onClick={() => setMode("create")}
            className={`flex-1 h-8 rounded-lg text-[13px] font-medium transition-all duration-150 ${
              mode === "create"
                ? "bg-surface text-foreground shadow-sm"
                : "text-secondary hover:text-foreground"
            }`}
          >
            Create Room
          </button>
          <button
            type="button"
            onClick={() => setMode("join")}
            className={`flex-1 h-8 rounded-lg text-[13px] font-medium transition-all duration-150 ${
              mode === "join"
                ? "bg-surface text-foreground shadow-sm"
                : "text-secondary hover:text-foreground"
            }`}
          >
            Join Room
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5">
          {mode === "join" && (
            <div className="mb-4">
              <label className="text-[12px] font-medium text-secondary block mb-2">
                Room ID
              </label>
              <input
                type="text"
                placeholder="Enter room ID"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                required
                className="w-full h-10 px-3 border border-border-strong bg-surface rounded-[10px] text-[14px] text-foreground outline-none transition-all duration-150 focus:border-border-focused focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)] placeholder:text-tertiary"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={!connected}
            className="w-full h-11 rounded-[10px] bg-accent text-accent-foreground font-medium text-[15px] inline-flex items-center justify-center gap-2 border border-accent hover:bg-accent/80 transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            <Icon name={mode === "create" ? "play" : "video"} size={12} />
            {mode === "create" ? "Create Room" : "Join Room"}
          </button>
        </form>

        {error && (
          <div className="mt-4 text-[13px] text-error bg-error/5 border border-error/15 rounded-[10px] px-3 py-2.5">
            {error}
          </div>
        )}

        <div className="mt-6 text-center">
          <Link
            to="/home"
            className="text-[13px] text-secondary hover:text-foreground transition-colors no-underline"
          >
            ← Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
