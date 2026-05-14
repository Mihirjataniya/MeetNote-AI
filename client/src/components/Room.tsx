import { useState } from "react";
import { useRoom } from "../contexts/RoomContext";
import { LocalVideo } from "./LocalVideo";
import { RemoteVideo } from "./RemoteVideo";

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
  const [copied, setCopied] = useState(false);

  const copyRoomId = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const peerLookup = new Map(
    participants.map((p) => [p.socketId, p.displayName])
  );

  return (
    <div className="room">
      <div className="room-header">
        <div className="room-info">
          <span className="room-id" onClick={copyRoomId} title="Click to copy">
            Room: {roomId?.slice(0, 8)}...
          </span>
          {copied && <span className="copied-toast">Copied!</span>}
        </div>
        <div className="room-actions">
          {!localStream && (
            <button className="btn-primary" onClick={startMedia}>
              Start Camera/Mic
            </button>
          )}
          <button className="btn-danger" onClick={leaveRoom}>
            Leave Room
          </button>
        </div>
      </div>

      {error && <p className="error-message">{error}</p>}

      <div className="video-grid">
        {localStream && <LocalVideo stream={localStream} />}
        {Array.from(remoteStreams.entries()).map(
          ([peerId, stream]) => (
            <RemoteVideo
              key={peerId}
              stream={stream}
              displayName={peerLookup.get(peerId) ?? peerId.slice(0, 8)}
            />
          )
        )}
      </div>

      <div className="participants-list">
        <h3>
          Participants ({participants.length})
        </h3>
        <ul>
          {participants.map((p) => (
            <li key={p.socketId}>
              {p.displayName}
              {p.socketId === socketId ? " (you)" : ""}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
