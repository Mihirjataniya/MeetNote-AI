import { useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { RoomProvider, useRoom } from "../contexts/RoomContext";
import { Room } from "../components/Room";
import { Icon } from "../components/shell/Icon";

function MeetingContent() {
  const { roomId: urlRoomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { roomId, connected, error, createRoom, joinRoom } = useRoom();
  const initiated = useRef(false);

  useEffect(() => {
    if (!connected || initiated.current || !urlRoomId) return;
    initiated.current = true;

    if (urlRoomId === "new") {
      createRoom();
    } else {
      joinRoom(urlRoomId);
    }
  }, [connected, urlRoomId, createRoom, joinRoom]);

  useEffect(() => {
    if (urlRoomId === "new" && roomId) {
      navigate(`/room/${roomId}`, { replace: true });
    }
  }, [urlRoomId, roomId, navigate]);

  if (roomId) return <Room />;

  return (
    <div className="h-full flex flex-col items-center justify-center bg-[#0a0a0a] text-white">
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
                ? "Creating room..."
                : "Joining room..."
              : "Connecting to server..."}
          </p>
        </div>
      )}
    </div>
  );
}

export function MeetingPage() {
  return (
    <RoomProvider>
      <MeetingContent />
    </RoomProvider>
  );
}
