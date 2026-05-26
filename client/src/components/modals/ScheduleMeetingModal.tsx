import { useState } from "react";
import { Modal } from "../shell/Modal";
import { Icon } from "../shell/Icon";
import { Avatar } from "../shell/Avatar";

interface ScheduleMeetingModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const PEOPLE = [
  { name: "Sara Kim", email: "sara@northwind.co", role: "Product" },
  { name: "Diego Ortiz", email: "diego@northwind.co", role: "Engineering" },
  { name: "Mei Tanaka", email: "mei@northwind.co", role: "Design" },
  { name: "Priya Shah", email: "priya@halcyon.io", role: "Customer" },
  { name: "Tomás Lindqvist", email: "tomas@folio.com", role: "Customer" },
  { name: "Aliyah Brooks", email: "aliyah@plate.co", role: "Customer" },
];

export function ScheduleMeetingModal({ open, onClose, onConfirm }: ScheduleMeetingModalProps) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState("2026-05-20");
  const [time, setTime] = useState("15:00");
  const [duration, setDuration] = useState("45");
  const [participants, setParticipants] = useState<string[]>(["Sara Kim", "Diego Ortiz"]);
  const [query, setQuery] = useState("");

  const available = PEOPLE.filter(
    (p) =>
      !participants.includes(p.name) &&
      (!query || p.name.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Schedule a meeting"
      subtitle="MeetNote will send invites and join automatically."
      width={580}
      footer={
        <>
          <button
            className="h-[38px] px-4 rounded-[10px] text-[14px] font-medium text-foreground hover:bg-hover transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="h-[38px] px-4 rounded-[10px] bg-accent text-accent-foreground text-[14px] font-medium border border-accent hover:bg-accent/80 transition-all inline-flex items-center gap-2 active:scale-[0.98]"
            onClick={onConfirm}
          >
            <Icon name="calendar" size={12} /> Schedule
          </button>
        </>
      }
    >
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
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Agenda, prep links, context..."
        />
      </div>

      {/* Date / Time / Duration — stacks on mobile */}
      <div className="grid grid-cols-1 xs:grid-cols-3 gap-2.5 mb-3.5">
        <div>
          <label className="text-[12px] font-medium text-secondary block mb-2">Date</label>
          <input
            type="date"
            className="w-full h-10 px-3 border border-border-strong bg-surface rounded-[10px] text-[14px] text-foreground outline-none transition-all duration-150 focus:border-border-focused focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)]"
            value={date}
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
          </select>
        </div>
      </div>

      {/* Participants picker */}
      <div className="mb-1.5">
        <label className="text-[12px] font-medium text-secondary block mb-2">Participants</label>
        <div className="min-h-10 p-1.5 border border-border-strong rounded-[10px] flex flex-wrap items-center gap-1.5 bg-surface transition-all duration-150 focus-within:border-border-focused focus-within:shadow-[0_0_0_4px_rgba(0,0,0,0.04)]">
          {participants.map((p) => (
            <span
              key={p}
              className="inline-flex items-center gap-1.5 pl-1 pr-1.5 py-0.5 bg-surface-hover rounded-full border border-border text-[12px] font-medium"
            >
              <Avatar name={p} size={18} />
              {p}
              <button
                onClick={() => setParticipants(participants.filter((x) => x !== p))}
                className="bg-transparent border-none text-tertiary cursor-pointer flex items-center p-0 ml-0.5 hover:text-foreground transition-colors"
              >
                <Icon name="x" size={12} />
              </button>
            </span>
          ))}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={participants.length ? "Add someone..." : "Search teammates..."}
            className="flex-1 min-w-[100px] border-none outline-none px-1.5 py-1 text-[13px] bg-transparent placeholder:text-tertiary"
          />
        </div>

        {query && available.length > 0 && (
          <div className="mt-1 bg-surface border border-border rounded-[14px] shadow-lg p-1">
            {available.slice(0, 4).map((p) => (
              <button
                key={p.name}
                onClick={() => {
                  setParticipants([...participants, p.name]);
                  setQuery("");
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] bg-transparent border-none cursor-pointer text-left hover:bg-hover transition-colors"
              >
                <Avatar name={p.name} size={22} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-foreground">{p.name}</div>
                  <div className="text-[11px] text-tertiary">{p.email}</div>
                </div>
                <span className="text-[11px] font-medium text-tertiary bg-surface-hover border border-border rounded-full px-2.5 py-0.5 hidden xs:inline">
                  {p.role}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-4 pt-3.5 border-t border-border text-[12px] text-secondary items-center">
        <Icon name="sparkle" size={13} />
        <span>MeetNote will join automatically · auto-record · auto-generate notes</span>
      </div>
    </Modal>
  );
}
