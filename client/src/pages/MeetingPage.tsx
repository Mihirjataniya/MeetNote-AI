import { useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { RoomProvider, useRoom } from "../contexts/RoomContext";
import { Room } from "../components/Room";
import { Icon } from "../components/shell/Icon";

function MeetingContent() {
  const { roomId: urlRoomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { roomId, meetingId, connected, error, createRoom, joinRoom, clearMeetingId } = useRoom();
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

  useEffect(() => {
    if (!roomId && meetingId) {
      const timer = setTimeout(() => {
        clearMeetingId();
        navigate("/home");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [roomId, meetingId, clearMeetingId, navigate]);

  if (roomId) return <Room />;

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
  return (
    <RoomProvider>
      <MeetingContent />
    </RoomProvider>
  );
}
