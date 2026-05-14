import { useState } from "react";
import { useRoom } from "../contexts/RoomContext";

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
    <div className="join-form">
      <h2>Join a Meeting</h2>
      <div className="connection-status">
        <span className={`status-dot ${connected ? "connected" : ""}`} />
        {connected ? "Connected to server" : "Connecting..."}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mode-tabs">
          <button
            type="button"
            className={mode === "create" ? "active" : ""}
            onClick={() => setMode("create")}
          >
            Create Room
          </button>
          <button
            type="button"
            className={mode === "join" ? "active" : ""}
            onClick={() => setMode("join")}
          >
            Join Room
          </button>
        </div>

        {mode === "join" && (
          <input
            type="text"
            placeholder="Room ID"
            value={joinRoomId}
            onChange={(e) => setJoinRoomId(e.target.value)}
            required
          />
        )}

        <button type="submit" className="btn-primary" disabled={!connected}>
          {mode === "create" ? "Create Room" : "Join Room"}
        </button>
      </form>

      {error && <p className="error-message">{error}</p>}
    </div>
  );
}
