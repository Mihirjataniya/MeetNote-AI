import { useMemo, useState } from "react";
import { Icon } from "../shell/Icon";
import { ScheduledMeetingCard } from "./ScheduledMeetingCard";
import type { ScheduledMeetingSummary } from "../../services/schedules";

interface Props {
  meetings: ScheduledMeetingSummary[];
  onEdit: (m: ScheduledMeetingSummary) => void;
  onCancel: (m: ScheduledMeetingSummary) => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function startOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1);
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function formatSelectedDayLabel(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m, d).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function ScheduleMonthView({ meetings, onEdit, onCancel }: Props) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const grid = useMemo(() => {
    const first = startOfMonth(cursor.getFullYear(), cursor.getMonth());
    const startWeekday = first.getDay();
    const totalCells = 42;
    const cells: { date: Date; inMonth: boolean }[] = [];
    const gridStart = new Date(first);
    gridStart.setDate(gridStart.getDate() - startWeekday);
    for (let i = 0; i < totalCells; i++) {
      const d = new Date(gridStart);
      d.setDate(d.getDate() + i);
      cells.push({ date: d, inMonth: d.getMonth() === cursor.getMonth() });
    }
    return cells;
  }, [cursor]);

  const byDay = useMemo(() => {
    const map = new Map<string, ScheduledMeetingSummary[]>();
    for (const m of meetings) {
      const k = dayKey(new Date(m.scheduledStartTime));
      const arr = map.get(k);
      if (arr) arr.push(m);
      else map.set(k, [m]);
    }
    for (const arr of map.values()) {
      arr.sort(
        (a, b) =>
          new Date(a.scheduledStartTime).getTime() - new Date(b.scheduledStartTime).getTime()
      );
    }
    return map;
  }, [meetings]);

  const today = new Date();
  const todayKey = dayKey(today);
  const selectedMeetings = selectedDay ? byDay.get(selectedDay) ?? [] : [];
  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <div className="bg-surface border border-border rounded-[14px] shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="text-[14px] font-semibold text-foreground">{monthLabel}</div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-secondary hover:bg-surface-hover hover:text-foreground transition-colors"
            title="Previous month"
          >
            <Icon name="chevronLeft" size={14} />
          </button>
          <button
            onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}
            className="h-8 px-3 rounded-lg border border-border text-[12px] font-medium text-secondary hover:bg-surface-hover hover:text-foreground transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-secondary hover:bg-surface-hover hover:text-foreground transition-colors"
            title="Next month"
          >
            <Icon name="chevronRight" size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-[11px] font-medium tracking-[0.06em] uppercase text-tertiary border-b border-border">
        {WEEKDAYS.map((w) => (
          <div key={w} className="px-3 py-2 text-center">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {grid.map(({ date, inMonth }, idx) => {
          const k = dayKey(date);
          const list = byDay.get(k) ?? [];
          const isToday = k === todayKey;
          const isSelected = k === selectedDay;
          return (
            <button
              key={idx}
              onClick={() => setSelectedDay(list.length > 0 ? k : null)}
              className={`min-h-[88px] sm:min-h-[110px] text-left p-1.5 sm:p-2 border-r border-b border-border last:border-r-0 flex flex-col gap-1 transition-colors ${
                inMonth ? "bg-surface" : "bg-surface-muted/30"
              } ${isSelected ? "ring-2 ring-accent ring-inset" : ""} ${list.length > 0 ? "cursor-pointer hover:bg-surface-hover" : "cursor-default"}`}
            >
              <span
                className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[12px] font-medium ${
                  isToday
                    ? "bg-accent text-accent-foreground"
                    : inMonth
                      ? "text-foreground"
                      : "text-tertiary"
                }`}
              >
                {date.getDate()}
              </span>
              <div className="flex flex-col gap-[3px] overflow-hidden">
                {list.slice(0, 2).map((m) => (
                  <div
                    key={m.id}
                    className="text-[10.5px] font-medium px-1.5 py-[2px] rounded bg-blue-500/10 text-blue-400 truncate"
                  >
                    {new Date(m.scheduledStartTime).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    {m.title}
                  </div>
                ))}
                {list.length > 2 && (
                  <div className="text-[10px] text-tertiary px-1.5">+{list.length - 2} more</div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedDay && selectedMeetings.length > 0 && (
        <div className="border-t border-border bg-surface-hover/40 p-3 sm:p-4 flex flex-col gap-2">
          <div className="text-[11px] uppercase tracking-[0.08em] text-tertiary font-medium">
            {formatSelectedDayLabel(selectedDay)}
          </div>
          {selectedMeetings.map((m) => (
            <ScheduledMeetingCard key={m.id} meeting={m} onEdit={onEdit} onCancel={onCancel} />
          ))}
        </div>
      )}
    </div>
  );
}
