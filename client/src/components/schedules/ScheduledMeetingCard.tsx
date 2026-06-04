import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "../shell/Icon";
import { AvatarGroup } from "../shell/Avatar";
import { downloadScheduleIcs, type ScheduledMeetingSummary } from "../../services/schedules";

interface Props {
  meeting: ScheduledMeetingSummary;
  onEdit: (m: ScheduledMeetingSummary) => void;
  onCancel: (m: ScheduledMeetingSummary) => void;
}

const STATUS_PILL: Record<string, { label: string; cls: string }> = {
  scheduled: { label: "Scheduled", cls: "bg-blue-500/10 text-blue-400" },
  ready: { label: "Starting soon", cls: "bg-emerald-500/10 text-emerald-400" },
  active: { label: "Live", cls: "bg-[#dc2626]/10 text-[#f87171]" },
  ended: { label: "Ended", cls: "bg-surface-hover text-tertiary" },
  missed: { label: "Missed", cls: "bg-amber-500/10 text-amber-400" },
  cancelled: { label: "Cancelled", cls: "bg-surface-hover text-tertiary line-through" },
};

function formatStartTime(iso: string, durationMin: number): string {
  const start = new Date(iso);
  const end = new Date(start.getTime() + durationMin * 60_000);
  const date = start.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const tStart = start.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  const tEnd = end.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return `${date} · ${tStart} – ${tEnd}`;
}

function formatRelative(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  const absMin = Math.round(Math.abs(diff) / 60_000);
  if (absMin < 1) return diff >= 0 ? "now" : "just now";
  if (absMin < 60) return diff >= 0 ? `in ${absMin} min` : `${absMin} min ago`;
  const absHr = Math.round(absMin / 60);
  if (absHr < 24) return diff >= 0 ? `in ${absHr} hr` : `${absHr} hr ago`;
  const absDay = Math.round(absHr / 24);
  return diff >= 0 ? `in ${absDay} day${absDay === 1 ? "" : "s"}` : `${absDay} day${absDay === 1 ? "" : "s"} ago`;
}

export function ScheduledMeetingCard({ meeting, onEdit, onCancel }: Props) {
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);
  const pill = STATUS_PILL[meeting.effectiveStatus] ?? STATUS_PILL.scheduled;
  const canJoin = meeting.effectiveStatus === "ready" || meeting.effectiveStatus === "active";
  const showHostActions = meeting.isHost && meeting.status === "scheduled";

  const guests = [meeting.hostName, ...meeting.invitedUsers.map((u) => u.displayName)];
  const start = new Date(meeting.scheduledStartTime);
  const day = start.getDate();
  const dow = start.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase();

  async function handleIcs() {
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadScheduleIcs(meeting.id, meeting.title);
    } catch (e) {
      console.error("[Ics] download failed:", e);
    } finally {
      setDownloading(false);
    }
  }

  function handleJoin() {
    const hostQuery = meeting.isHost ? "&host=1" : "";
    navigate(`/room/${meeting.roomId}?scheduledMeetingId=${meeting.id}${hostQuery}`);
  }

  return (
    <div className="bg-surface border border-border rounded-[14px] shadow-sm px-4 sm:px-[18px] py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 transition-colors duration-[120ms] hover:bg-surface-hover">
      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
        <div className="w-12 sm:w-14 py-1.5 rounded-[10px] bg-surface-hover border border-border flex flex-col items-center shrink-0">
          <div className="text-[10px] tracking-[0.06em] text-tertiary uppercase font-medium">
            {dow}
          </div>
          <div className="text-[18px] sm:text-[20px] font-semibold text-foreground tabular-nums">
            {day}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13.5px] sm:text-[14px] font-semibold text-foreground overflow-hidden text-ellipsis whitespace-nowrap">
              {meeting.title}
            </span>
            <span
              className={`shrink-0 px-2.5 py-[3px] rounded-full text-[11px] font-medium ${pill.cls}`}
            >
              {pill.label}
            </span>
            {meeting.recurrenceParentId && (
              <span className="shrink-0 px-2.5 py-[3px] rounded-full bg-surface-hover text-secondary text-[11px] font-medium inline-flex items-center gap-1">
                <Icon name="history" size={10} /> Recurring
              </span>
            )}
          </div>
          <div className="text-[11.5px] sm:text-[12px] text-tertiary mt-[3px]">
            {formatStartTime(meeting.scheduledStartTime, meeting.scheduledDurationMin)}
            {meeting.effectiveStatus === "scheduled" && (
              <span className="ml-1 text-secondary">· {formatRelative(meeting.scheduledStartTime)}</span>
            )}
          </div>
          {guests.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <AvatarGroup names={guests} size={20} max={4} />
              <span className="text-[11px] text-tertiary">
                {guests.length} {guests.length === 1 ? "person" : "people"}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={handleIcs}
          disabled={downloading}
          title="Add to calendar (.ics)"
          className="shrink-0 h-8 w-8 rounded-lg border border-border flex items-center justify-center text-secondary hover:bg-surface-hover hover:text-foreground transition-colors disabled:opacity-50"
        >
          <Icon name="calendar" size={14} />
        </button>
        {showHostActions && (
          <>
            <button
              onClick={() => onEdit(meeting)}
              title="Edit meeting"
              className="shrink-0 h-8 w-8 rounded-lg border border-border flex items-center justify-center text-secondary hover:bg-surface-hover hover:text-foreground transition-colors"
            >
              <Icon name="edit" size={13} />
            </button>
            <button
              onClick={() => onCancel(meeting)}
              title="Cancel meeting"
              className="shrink-0 h-8 w-8 rounded-lg border border-border flex items-center justify-center text-secondary hover:bg-[#dc2626]/10 hover:text-[#f87171] transition-colors"
            >
              <Icon name="x" size={13} />
            </button>
          </>
        )}
        {canJoin && (
          <button
            onClick={handleJoin}
            className="shrink-0 h-8 px-3 rounded-lg bg-accent text-accent-foreground font-medium text-[13px] inline-flex items-center gap-1.5 border border-accent hover:bg-accent/80 transition-all duration-150 active:scale-[0.98]"
          >
            <Icon name="video" size={12} /> Join
          </button>
        )}
      </div>
    </div>
  );
}
