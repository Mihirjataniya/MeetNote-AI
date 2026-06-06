/* eslint-disable react-refresh/only-export-components */
import { useState } from "react";
import { Icon } from "./shell/Icon";
import { fetchMeetingNotes, type MeetingSummary } from "../services/meetings";
import { useTogglePinMeeting } from "../queries/useMeetingsQuery";

export function formatDuration(ms?: number): string {
  if (!ms) return "";
  const totalMin = Math.round(ms / 60000);
  if (totalMin < 60) return `${totalMin}m`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatWhen(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return (
    d.toLocaleDateString("en-US", { day: "numeric", month: "short" }) +
    " · " +
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
  );
}

export function NotesBadge({ status }: { status: string | null }) {
  if (status === "completed") {
    return (
      <span className="shrink-0 px-2.5 py-[3px] rounded-full bg-blue-500/10 text-blue-400 text-[11px] font-medium">
        Notes ready
      </span>
    );
  }
  if (status === "generating") {
    return (
      <span className="shrink-0 px-2.5 py-[3px] rounded-full bg-amber-500/10 text-amber-400 text-[11px] font-medium">
        Generating notes...
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="shrink-0 px-2.5 py-[3px] rounded-full bg-[#dc2626]/10 text-[#f87171] text-[11px] font-medium">
        Notes failed
      </span>
    );
  }
  return null;
}

async function downloadNotes(meetingId: string, title?: string) {
  const markdown = await fetchMeetingNotes(meetingId);
  const { downloadNotesPdf } = await import("../utils/notesPdf");
  await downloadNotesPdf(markdown, title);
}

export function MeetingRow({ m }: { m: MeetingSummary }) {
  const [downloadingNotes, setDownloadingNotes] = useState(false);
  const togglePin = useTogglePinMeeting();

  const handleNotesDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (downloadingNotes) return;
    setDownloadingNotes(true);
    try {
      await downloadNotes(m.id, m.title);
    } catch {
      console.error("Notes download failed");
    } finally {
      setDownloadingNotes(false);
    }
  };

  const handleTogglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (togglePin.isPending) return;
    togglePin.mutate({ meetingId: m.id, pinned: !m.pinned });
  };

  return (
    <div className="bg-surface border border-border rounded-[14px] shadow-sm px-4 sm:px-[18px] py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 transition-colors duration-[120ms] hover:bg-surface-hover cursor-pointer">
      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-surface-hover border border-border flex items-center justify-center text-secondary shrink-0">
          <Icon name="fileText" size={15} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13.5px] sm:text-[14px] font-semibold text-foreground overflow-hidden text-ellipsis whitespace-nowrap">
              {m.title || "Untitled Meeting"}
            </span>
            <NotesBadge status={m.notesStatus} />
          </div>
          <div className="text-[11.5px] sm:text-[12px] text-tertiary mt-[3px]">
            {formatWhen(m.startedAt)}
            {m.durationMs ? ` · ${formatDuration(m.durationMs)}` : ""}
            {` · ${m.participantCount} attendees`}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleTogglePin}
          disabled={togglePin.isPending}
          title={m.pinned ? "Unpin from sidebar" : "Pin to sidebar"}
          className={`shrink-0 h-8 w-8 rounded-lg border flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            m.pinned
              ? "border-accent text-accent bg-accent/10 hover:bg-accent/15"
              : "border-border text-secondary hover:bg-surface-hover hover:text-foreground"
          }`}
        >
          <Icon name="pin" size={14} />
        </button>
        {m.notesStatus === "completed" && (
          <button
            onClick={handleNotesDownload}
            disabled={downloadingNotes}
            title={downloadingNotes ? "Preparing PDF..." : "Download meeting notes as PDF"}
            className="shrink-0 h-8 w-8 rounded-lg border border-border flex items-center justify-center text-secondary hover:bg-surface-hover hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloadingNotes ? (
              <Icon name="spinner" size={14} className="animate-spin" />
            ) : (
              <Icon name="sparkle" size={14} />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
