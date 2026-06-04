import { useEffect, useMemo, useState } from "react";
import { Modal } from "../shell/Modal";
import { Icon } from "../shell/Icon";
import { Avatar } from "../shell/Avatar";
import { useDebounce } from "../../utils/useDebounce";
import { useUserSearch } from "../../queries/useUserSearchQuery";
import { useCreateScheduledMeeting } from "../../queries/useScheduleMutations";
import type { RecurrenceFrequency } from "../../services/schedules";
import type { UserSummary } from "../../services/users";

interface ScheduleMeetingModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

type RecurrenceChoice = "none" | RecurrenceFrequency;

function localDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function defaultStart(): { date: string; time: string } {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 30 - (now.getMinutes() % 15));
  now.setSeconds(0, 0);
  return {
    date: localDateInputValue(now),
    time: `${`${now.getHours()}`.padStart(2, "0")}:${`${now.getMinutes()}`.padStart(2, "0")}`,
  };
}

function defaultUntil(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  d.setMonth(d.getMonth() + 1);
  return localDateInputValue(d);
}

export function ScheduleMeetingModal({ open, onClose, onCreated }: ScheduleMeetingModalProps) {
  const initial = useMemo(defaultStart, []);
  const [title, setTitle] = useState("");
  const [agenda, setAgenda] = useState("");
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [duration, setDuration] = useState("30");
  const [recurrence, setRecurrence] = useState<RecurrenceChoice>("none");
  const [until, setUntil] = useState(defaultUntil(initial.date));
  const [participants, setParticipants] = useState<UserSummary[]>([]);
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 300);
  const search = useUserSearch(debounced);
  const create = useCreateScheduledMeeting();

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
  }, [open]);

  useEffect(() => {
    if (recurrence !== "none" && until < date) setUntil(defaultUntil(date));
  }, [date, recurrence, until]);

  const filteredResults = (search.data ?? []).filter(
    (u) => !participants.some((p) => p.id === u.id)
  );

  function reset() {
    const next = defaultStart();
    setTitle("");
    setAgenda("");
    setDate(next.date);
    setTime(next.time);
    setDuration("30");
    setRecurrence("none");
    setUntil(defaultUntil(next.date));
    setParticipants([]);
    setQuery("");
    setError(null);
  }

  function handleClose() {
    if (create.isPending) return;
    reset();
    onClose();
  }

  async function handleSubmit() {
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
    const durationMin = Number(duration);
    const payload = {
      title: title.trim(),
      agenda: agenda.trim() || undefined,
      scheduledStartTime: start.toISOString(),
      scheduledDurationMin: durationMin,
      invitedUserIds: participants.map((p) => p.id),
      recurrence:
        recurrence === "none"
          ? undefined
          : {
              frequency: recurrence,
              interval: 1,
              until: new Date(`${until}T23:59:59`).toISOString(),
            },
    };
    try {
      const res = await create.mutateAsync(payload);
      if (res.clipped) {
        setError(`Series capped at 52 occurrences.`);
      }
      reset();
      onCreated?.();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to schedule meeting");
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Schedule a meeting"
      subtitle="Pick a time and invite your team."
      width={600}
      footer={
        <>
          <button
            className="h-[38px] px-4 rounded-[10px] text-[14px] font-medium text-foreground hover:bg-hover transition-colors disabled:opacity-50"
            onClick={handleClose}
            disabled={create.isPending}
          >
            Cancel
          </button>
          <button
            className="h-[38px] px-4 rounded-[10px] bg-accent text-accent-foreground text-[14px] font-medium border border-accent hover:bg-accent/80 transition-all inline-flex items-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            onClick={handleSubmit}
            disabled={create.isPending}
          >
            <Icon name="calendar" size={12} />
            {create.isPending ? "Scheduling..." : "Schedule"}
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
          className="w-full h-10 px-3 border border-border-strong bg-surface rounded-[10px] text-[14px] text-foreground outline-none transition-all duration-150 focus:border-border-focused focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)] placeholder:text-tertiary"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Roadmap review with founders"
          autoFocus
        />
      </div>

      <div className="mb-3.5">
        <label className="text-[12px] font-medium text-secondary block mb-2">
          Description <span className="text-muted font-normal">(optional)</span>
        </label>
        <textarea
          className="w-full px-3 py-2.5 border border-border-strong bg-surface rounded-[10px] text-[14px] text-foreground outline-none transition-all duration-150 focus:border-border-focused focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)] placeholder:text-tertiary resize-none leading-relaxed"
          rows={2}
          value={agenda}
          onChange={(e) => setAgenda(e.target.value)}
          placeholder="Agenda, prep links, context..."
        />
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-3 gap-2.5 mb-3.5">
        <div>
          <label className="text-[12px] font-medium text-secondary block mb-2">Date</label>
          <input
            type="date"
            className="w-full h-10 px-3 border border-border-strong bg-surface rounded-[10px] text-[14px] text-foreground outline-none transition-all duration-150 focus:border-border-focused focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)]"
            value={date}
            min={localDateInputValue(new Date())}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <label className="text-[12px] font-medium text-secondary block mb-2">Time</label>
          <input
            type="time"
            className="w-full h-10 px-3 border border-border-strong bg-surface rounded-[10px] text-[14px] text-foreground outline-none transition-all duration-150 focus:border-border-focused focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)]"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
        <div>
          <label className="text-[12px] font-medium text-secondary block mb-2">Duration</label>
          <select
            className="w-full h-10 px-3 border border-border-strong bg-surface rounded-[10px] text-[14px] text-foreground outline-none transition-all duration-150 focus:border-border-focused focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)]"
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

      <div className="grid grid-cols-1 xs:grid-cols-2 gap-2.5 mb-3.5">
        <div>
          <label className="text-[12px] font-medium text-secondary block mb-2">Repeats</label>
          <select
            className="w-full h-10 px-3 border border-border-strong bg-surface rounded-[10px] text-[14px] text-foreground outline-none transition-all duration-150 focus:border-border-focused focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)]"
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value as RecurrenceChoice)}
          >
            <option value="none">Doesn't repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        {recurrence !== "none" && (
          <div>
            <label className="text-[12px] font-medium text-secondary block mb-2">Ends on</label>
            <input
              type="date"
              className="w-full h-10 px-3 border border-border-strong bg-surface rounded-[10px] text-[14px] text-foreground outline-none transition-all duration-150 focus:border-border-focused focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)]"
              value={until}
              min={date}
              onChange={(e) => setUntil(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="mb-1.5">
        <label className="text-[12px] font-medium text-secondary block mb-2">
          Participants{" "}
          <span className="text-muted font-normal">({participants.length})</span>
        </label>
        <div className="min-h-10 p-1.5 border border-border-strong rounded-[10px] flex flex-wrap items-center gap-1.5 bg-surface transition-all duration-150 focus-within:border-border-focused focus-within:shadow-[0_0_0_4px_rgba(0,0,0,0.04)]">
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

      <div className="flex gap-2 mt-4 pt-3.5 border-t border-border text-[12px] text-secondary items-center">
        <Icon name="sparkle" size={13} />
        <span>Notes will be generated automatically once the meeting ends.</span>
      </div>
    </Modal>
  );
}
