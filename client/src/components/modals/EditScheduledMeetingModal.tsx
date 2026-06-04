import { useEffect, useState } from "react";
import { Modal } from "../shell/Modal";
import { Icon } from "../shell/Icon";
import { Avatar } from "../shell/Avatar";
import { useDebounce } from "../../utils/useDebounce";
import { useUserSearch } from "../../queries/useUserSearchQuery";
import { useUpdateScheduledMeeting } from "../../queries/useScheduleMutations";
import type { ScheduledMeetingSummary } from "../../services/schedules";
import type { UserSummary } from "../../services/users";

interface Props {
  open: boolean;
  meeting: ScheduledMeetingSummary | null;
  onClose: () => void;
}

function pad(n: number): string {
  return `${n}`.padStart(2, "0");
}

function isoToLocalParts(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

export function EditScheduledMeetingModal({ open, meeting, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [agenda, setAgenda] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("30");
  const [participants, setParticipants] = useState<UserSummary[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const debounced = useDebounce(query, 300);
  const search = useUserSearch(debounced);
  const update = useUpdateScheduledMeeting();

  useEffect(() => {
    if (!open || !meeting) return;
    const parts = isoToLocalParts(meeting.scheduledStartTime);
    setTitle(meeting.title);
    setAgenda(meeting.agenda ?? "");
    setDate(parts.date);
    setTime(parts.time);
    setDuration(String(meeting.scheduledDurationMin));
    setParticipants(
      meeting.invitedUsers.map((u) => ({
        id: u.id,
        displayName: u.displayName,
        email: u.email,
      }))
    );
    setQuery("");
    setError(null);
  }, [open, meeting]);

  const filteredResults = (search.data ?? []).filter(
    (u) => !participants.some((p) => p.id === u.id)
  );

  async function handleSubmit() {
    if (!meeting) return;
    setError(null);
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    const start = new Date(`${date}T${time}`);
    if (isNaN(start.getTime())) {
      setError("Invalid date/time");
      return;
    }
    if (start.getTime() < Date.now() + 60_000) {
      setError("Start time must be in the future");
      return;
    }
    try {
      await update.mutateAsync({
        id: meeting.id,
        payload: {
          title: title.trim(),
          agenda: agenda.trim(),
          scheduledStartTime: start.toISOString(),
          scheduledDurationMin: Number(duration),
          invitedUserIds: participants.map((p) => p.id),
        },
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    }
  }

  return (
    <Modal
      open={open && !!meeting}
      onClose={() => {
        if (!update.isPending) onClose();
      }}
      title="Edit meeting"
      subtitle={meeting?.recurrenceParentId ? "Changes apply to this occurrence only." : undefined}
      width={580}
      footer={
        <>
          <button
            className="h-[38px] px-4 rounded-[10px] text-[14px] font-medium text-foreground hover:bg-hover transition-colors disabled:opacity-50"
            onClick={onClose}
            disabled={update.isPending}
          >
            Cancel
          </button>
          <button
            className="h-[38px] px-4 rounded-[10px] bg-accent text-accent-foreground text-[14px] font-medium border border-accent hover:bg-accent/80 transition-all inline-flex items-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            onClick={handleSubmit}
            disabled={update.isPending}
          >
            <Icon name="check" size={12} /> {update.isPending ? "Saving..." : "Save changes"}
          </button>
        </>
      }
    >
      {error && (
        <div className="mb-3 px-3 py-2 rounded-[10px] bg-[#dc2626]/10 border border-[#dc2626]/20 text-[12.5px] text-[#fca5a5]">
          {error}
        </div>
      )}

      <div className="mb-3.5">
        <label className="text-[12px] font-medium text-secondary block mb-2">Title</label>
        <input
          className="w-full h-10 px-3 border border-border-strong bg-surface rounded-[10px] text-[14px] text-foreground outline-none focus:border-border-focused focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)]"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="mb-3.5">
        <label className="text-[12px] font-medium text-secondary block mb-2">
          Description <span className="text-muted font-normal">(optional)</span>
        </label>
        <textarea
          className="w-full px-3 py-2.5 border border-border-strong bg-surface rounded-[10px] text-[14px] text-foreground outline-none focus:border-border-focused focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)] resize-none leading-relaxed"
          rows={2}
          value={agenda}
          onChange={(e) => setAgenda(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-3 gap-2.5 mb-3.5">
        <div>
          <label className="text-[12px] font-medium text-secondary block mb-2">Date</label>
          <input
            type="date"
            className="w-full h-10 px-3 border border-border-strong bg-surface rounded-[10px] text-[14px] text-foreground outline-none focus:border-border-focused focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)]"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <label className="text-[12px] font-medium text-secondary block mb-2">Time</label>
          <input
            type="time"
            className="w-full h-10 px-3 border border-border-strong bg-surface rounded-[10px] text-[14px] text-foreground outline-none focus:border-border-focused focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)]"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
        <div>
          <label className="text-[12px] font-medium text-secondary block mb-2">Duration</label>
          <select
            className="w-full h-10 px-3 border border-border-strong bg-surface rounded-[10px] text-[14px] text-foreground outline-none focus:border-border-focused focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)]"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          >
            <option value="15">15 min</option>
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="60">1 hour</option>
            <option value="90">1.5 hours</option>
            <option value="120">2 hours</option>
          </select>
        </div>
      </div>

      <div className="mb-1.5">
        <label className="text-[12px] font-medium text-secondary block mb-2">
          Participants <span className="text-muted font-normal">({participants.length})</span>
        </label>
        <div className="min-h-10 p-1.5 border border-border-strong rounded-[10px] flex flex-wrap items-center gap-1.5 bg-surface focus-within:border-border-focused focus-within:shadow-[0_0_0_4px_rgba(0,0,0,0.04)]">
          {participants.map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1.5 pl-1 pr-1.5 py-0.5 bg-surface-hover rounded-full border border-border text-[12px] font-medium"
            >
              <Avatar name={p.displayName} size={18} />
              {p.displayName}
              <button
                onClick={() => setParticipants(participants.filter((x) => x.id !== p.id))}
                className="bg-transparent border-none text-tertiary cursor-pointer flex items-center p-0 ml-0.5 hover:text-foreground transition-colors"
              >
                <Icon name="x" size={12} />
              </button>
            </span>
          ))}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={participants.length ? "Add someone..." : "Search by name or email..."}
            className="flex-1 min-w-[140px] border-none outline-none px-1.5 py-1 text-[13px] bg-transparent placeholder:text-tertiary"
          />
        </div>

        {debounced && (
          <div className="mt-1 bg-surface border border-border rounded-[14px] shadow-lg p-1 max-h-[220px] overflow-y-auto">
            {search.isLoading && (
              <div className="px-2.5 py-2 text-[12.5px] text-tertiary">Searching...</div>
            )}
            {!search.isLoading && filteredResults.length === 0 && (
              <div className="px-2.5 py-2 text-[12.5px] text-tertiary">No matches</div>
            )}
            {filteredResults.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  setParticipants([...participants, u]);
                  setQuery("");
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] bg-transparent border-none cursor-pointer text-left hover:bg-hover transition-colors"
              >
                <Avatar name={u.displayName} size={22} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-foreground">{u.displayName}</div>
                  <div className="text-[11px] text-tertiary">{u.email}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
