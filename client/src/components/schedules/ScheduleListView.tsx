import { Icon } from "../shell/Icon";
import { ScheduledMeetingCard } from "./ScheduledMeetingCard";
import type { ScheduledMeetingSummary } from "../../services/schedules";

interface Props {
  meetings: ScheduledMeetingSummary[];
  onEdit: (m: ScheduledMeetingSummary) => void;
  onCancel: (m: ScheduledMeetingSummary) => void;
}

type Bucket = "today" | "tomorrow" | "thisWeek" | "later" | "past";

const BUCKET_LABEL: Record<Bucket, string> = {
  today: "Today",
  tomorrow: "Tomorrow",
  thisWeek: "This week",
  later: "Later",
  past: "Past",
};

function bucketOf(iso: string): Bucket {
  const start = new Date(iso);
  const now = new Date();
  const todayY = now.getFullYear(), todayM = now.getMonth(), todayD = now.getDate();
  const startY = start.getFullYear(), startM = start.getMonth(), startD = start.getDate();

  const startMid = new Date(startY, startM, startD).getTime();
  const todayMid = new Date(todayY, todayM, todayD).getTime();
  const dayDiff = Math.round((startMid - todayMid) / 86_400_000);

  if (dayDiff < 0) return "past";
  if (dayDiff === 0) return "today";
  if (dayDiff === 1) return "tomorrow";
  if (dayDiff <= 7) return "thisWeek";
  return "later";
}

export function ScheduleListView({ meetings, onEdit, onCancel }: Props) {
  if (meetings.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-[14px] shadow-sm p-8 sm:p-12 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-xl bg-surface-hover border border-border flex items-center justify-center text-tertiary mb-4">
          <Icon name="calendar" size={22} />
        </div>
        <h3 className="text-[15px] font-semibold text-foreground font-display">Nothing scheduled</h3>
        <p className="text-[13px] text-tertiary mt-2 max-w-[320px]">
          Schedule a meeting to see it appear here and on your participants' calendars.
        </p>
      </div>
    );
  }

  const groups: Record<Bucket, ScheduledMeetingSummary[]> = {
    today: [],
    tomorrow: [],
    thisWeek: [],
    later: [],
    past: [],
  };
  for (const m of meetings) {
    groups[bucketOf(m.scheduledStartTime)].push(m);
  }

  const order: Bucket[] = ["today", "tomorrow", "thisWeek", "later", "past"];

  return (
    <div className="flex flex-col gap-6">
      {order.map((b) => {
        const items = groups[b];
        if (items.length === 0) return null;
        return (
          <section key={b}>
            <div className="text-[11px] uppercase tracking-[0.08em] text-tertiary font-medium mb-2.5">
              {BUCKET_LABEL[b]} · {items.length}
            </div>
            <div className="flex flex-col gap-2">
              {items.map((m) => (
                <ScheduledMeetingCard key={m.id} meeting={m} onEdit={onEdit} onCancel={onCancel} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
