import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSocketStore } from "../../stores/useSocketStore";
import { Toggle } from "../shell/Toggle";
import { Icon } from "../shell/Icon";

interface StartMeetingModalProps {
  open: boolean;
  onClose: () => void;
}

type Tab = "start" | "join";

export function StartMeetingModal({ open, onClose }: StartMeetingModalProps) {
  const navigate = useNavigate();
  const socket = useSocketStore((s) => s.socket);
  const [tab, setTab] = useState<Tab>("start");
  const [title, setTitle] = useState("Quick sync");
  const [desc, setDesc] = useState("");
  const [autoNotes, setAutoNotes] = useState(true);
  const [joinId, setJoinId] = useState("");
  const [starting, setStarting] = useState(false);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [open, handleClose]);

  if (!open) return null;

  const handleStart = () => {
    if (!socket?.connected || starting) return;
    setStarting(true);
    handleClose();
    navigate("/room/new?host=1", {
      state: {
        title: title.trim() || undefined,
        agenda: desc.trim() || undefined,
      },
    });
  };

  const handleJoin = () => {
    const id = joinId.trim();
    if (!id) return;
    handleClose();
    navigate(`/room/${id}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{
        background: "rgba(20, 20, 19, 0.32)",
        backdropFilter: "blur(6px)",
        animation: "fade-in 0.18s ease",
      }}
    >
      <div className="flex flex-col items-stretch sm:items-center w-full sm:w-auto">
        {/* Tabs — outside modal, attached to top */}
        <div className="flex self-start ml-4 sm:ml-6">
          <button
            onClick={() => setTab("start")}
            className={`px-4 sm:px-5 py-2.5 text-[13px] font-medium rounded-t-[10px] transition-colors duration-150 ${
              tab === "start"
                ? "bg-surface text-foreground"
                : "bg-surface-muted/80 text-tertiary hover:text-secondary"
            }`}
          >
            <span className="flex items-center gap-2">
              <Icon name="play" size={11} /> Start
              <span className="hidden sm:inline">meeting</span>
            </span>
          </button>
          <button
            onClick={() => setTab("join")}
            className={`px-4 sm:px-5 py-2.5 text-[13px] font-medium rounded-t-[10px] transition-colors duration-150 ${
              tab === "join"
                ? "bg-surface text-foreground"
                : "bg-surface-muted/80 text-tertiary hover:text-secondary"
            }`}
          >
            <span className="flex items-center gap-2">
              <Icon name="video" size={12} /> Join
              <span className="hidden sm:inline">meeting</span>
            </span>
          </button>
        </div>

        {/* Modal card */}
        <div
          className="bg-surface sm:rounded-[14px] rounded-t-[14px] rounded-tl-none shadow-lg border border-border overflow-hidden w-full sm:w-[520px] max-h-[80vh] sm:max-h-[85vh] flex flex-col"
          style={{ animation: "pop-in 0.22s cubic-bezier(0.2, 0.7, 0.3, 1)" }}
        >
          {/* Header */}
          <div className="px-5 sm:px-6 pt-5 pb-3.5 flex items-start gap-3.5 shrink-0">
            <div className="flex-1">
              <h3 className="text-[16px] sm:text-[17px] font-semibold tracking-tight font-display text-foreground leading-[1.3]">
                {tab === "start" ? "Start a meeting" : "Join a meeting"}
              </h3>
              <p className="text-[13px] text-secondary mt-1">
                {tab === "start"
                  ? "MeetNote Ai will join, record and write the notes."
                  : "Enter a room ID shared by the meeting host."}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="w-7 h-7 rounded-lg inline-flex items-center justify-center text-tertiary hover:bg-hover hover:text-foreground transition-colors"
            >
              <Icon name="x" size={14} />
            </button>
          </div>

          {/* Content */}
          <div className="px-5 sm:px-6 pb-5 overflow-y-auto flex-1">
            {tab === "start" ? (
              <>
                <div className="mb-3.5">
                  <label className="text-[12px] font-medium text-secondary block mb-2">
                    Meeting title
                  </label>
                  <input
                    className="w-full h-10 px-3 border border-border-strong bg-surface rounded-[10px] text-[14px] text-foreground outline-none transition-all duration-150 focus:border-border-focused focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)] placeholder:text-tertiary"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="mb-3.5">
                  <label className="text-[12px] font-medium text-secondary block mb-2">
                    Description{" "}
                    <span className="text-muted font-normal">(optional)</span>
                  </label>
                  <textarea
                    className="w-full px-3 py-2.5 border border-border-strong bg-surface rounded-[10px] text-[14px] text-foreground outline-none transition-all duration-150 focus:border-border-focused focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)] placeholder:text-tertiary resize-none leading-relaxed"
                    rows={3}
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="A short context for the AI summary: agenda, goal, attendees' background..."
                  />
                </div>

                <div className="p-3.5 bg-background border border-border rounded-[10px] mt-1.5">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <Icon name="sparkle" size={14} />
                      <span className="text-[13px] font-medium text-foreground">
                        Auto-generate notes
                      </span>
                    </div>
                    <Toggle on={autoNotes} onChange={setAutoNotes} />
                  </div>
                  <div className="text-[12px] text-secondary leading-relaxed">
                    A structured page with summary, decisions and action items will be
                    written within 60 seconds of hang-up.
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4">
                  <label className="text-[12px] font-medium text-secondary block mb-2">
                    Room ID
                  </label>
                  <input
                    className="w-full h-10 px-3 border border-border-strong bg-surface rounded-[10px] text-[14px] text-foreground outline-none transition-all duration-150 focus:border-border-focused focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)] placeholder:text-tertiary font-mono"
                    value={joinId}
                    onChange={(e) => setJoinId(e.target.value)}
                    placeholder="Paste the room ID here"
                    autoFocus
                  />
                </div>

                <div className="flex items-center gap-2.5 px-3.5 py-3 bg-background border border-border rounded-[10px] text-[12px] text-secondary leading-relaxed">
                  <Icon name="users" size={14} className="text-tertiary shrink-0" />
                  <span>
                    Ask the meeting host for the room ID. Once you join, MeetNote Ai
                    will record and generate notes automatically.
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 sm:px-6 py-3.5 border-t border-border bg-surface-hover flex justify-end gap-2 shrink-0">
            <button
              className="h-[38px] px-4 rounded-[10px] text-[14px] font-medium text-foreground hover:bg-hover transition-colors"
              onClick={handleClose}
            >
              Cancel
            </button>
            {tab === "start" ? (
              <button
                className="h-[38px] px-4 rounded-[10px] bg-accent text-accent-foreground text-[14px] font-medium border border-accent hover:bg-accent/80 transition-all inline-flex items-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                onClick={handleStart}
                disabled={starting || !socket?.connected}
              >
                <Icon name="play" size={11} /> {starting ? "Starting..." : "Start meeting"}
              </button>
            ) : (
              <button
                className="h-[38px] px-4 rounded-[10px] bg-accent text-accent-foreground text-[14px] font-medium border border-accent hover:bg-accent/80 transition-all inline-flex items-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                onClick={handleJoin}
                disabled={!joinId.trim()}
              >
                <Icon name="video" size={12} /> Join meeting
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
