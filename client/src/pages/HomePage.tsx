import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/useAuthStore";
import { useUIStore } from "../stores/useUIStore";
import { Icon } from "../components/shell/Icon";
import { AvatarGroup } from "../components/shell/Avatar";
import { MeetingRow } from "../components/MeetingRow";
import { useRecentMeetings, useMeetingStats } from "../queries/useMeetingsQuery";
import { useScheduledMeetings } from "../queries/useSchedulesQuery";
import type { ScheduledMeetingSummary } from "../services/schedules";

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatTimeRange(startIso: string, durationMin: number): string {
  const start = new Date(startIso);
  const end = new Date(start.getTime() + durationMin * 60_000);
  const fmt = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${fmt(start)} to ${fmt(end)}`;
}

function formatRelativeDate(iso: string): string {
  const start = new Date(iso);
  const now = new Date();
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((startDay.getTime() - today.getTime()) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return start.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });
}

function liveLabel(startIso: string, durationMin: number): string | null {
  const start = new Date(startIso).getTime();
  const end = start + durationMin * 60_000;
  const now = Date.now();
  if (now >= start && now <= end) return "Live now";
  const minsUntil = Math.round((start - now) / 60_000);
  if (minsUntil > 0 && minsUntil <= 15) return `Live in ${minsUntil}m`;
  return null;
}

function UpcomingCard({ m }: { m: ScheduledMeetingSummary }) {
  const navigate = useNavigate();
  const start = new Date(m.scheduledStartTime);
  const dow = WEEKDAY_SHORT[start.getDay()];
  const day = String(start.getDate());
  const participantNames = m.invitedUsers.map((u) => u.displayName).concat(m.hostName);
  const status = liveLabel(m.scheduledStartTime, m.scheduledDurationMin);
  const canJoin = Date.now() >= start.getTime() - 5 * 60_000;

  return (
    <div className="bg-surface border border-border rounded-[14px] shadow-sm p-4 sm:p-5 flex flex-col gap-3 sm:gap-4 transition-shadow duration-150 hover:shadow-md min-h-[180px] sm:min-h-[200px]">
      <div className="flex items-start gap-3">
        <div className="w-12 sm:w-14 py-2 sm:py-2.5 rounded-[10px] bg-surface-hover border border-border flex flex-col items-center shrink-0">
          <div className="text-[10px] sm:text-[10.5px] tracking-[0.06em] text-tertiary uppercase font-medium">{dow}</div>
          <div className="text-[20px] sm:text-[22px] font-semibold text-foreground tabular-nums">{day}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13.5px] sm:text-[14.5px] font-semibold text-foreground overflow-hidden text-ellipsis whitespace-nowrap">
            {m.title}
          </div>
          <div className="text-[11.5px] sm:text-[12px] text-secondary mt-1">
            {formatRelativeDate(m.scheduledStartTime)} · {formatTimeRange(m.scheduledStartTime, m.scheduledDurationMin)}
          </div>
        </div>
        {status && (
          <span className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-[3px] rounded-full bg-surface-hover border border-border text-[10px] sm:text-[11px] font-medium text-secondary whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_0_3px_rgba(22,163,74,0.15)]" />
            {status}
          </span>
        )}
      </div>

      <div className="flex-1" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AvatarGroup names={participantNames} size={22} max={3} />
          <span className="text-[11px] sm:text-[11.5px] text-tertiary">
            {participantNames.length} guest{participantNames.length === 1 ? "" : "s"}
          </span>
        </div>
        <button
          onClick={() => navigate(`/room/${m.roomId}?scheduledMeetingId=${m.id}${m.isHost ? "&host=1" : ""}`)}
          disabled={!canJoin}
          className="h-[30px] px-[11px] rounded-lg bg-accent text-accent-foreground font-medium text-[13px] inline-flex items-center gap-1.5 border border-accent hover:bg-accent/80 transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Icon name="video" size={12} /> Join
        </button>
      </div>
    </div>
  );
}


export function HomePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const openStartMeeting = useUIStore((s) => s.openStartMeeting);
  const openScheduleMeeting = useUIStore((s) => s.openScheduleMeeting);
  const { data: recentMeetings = [], isLoading: loadingMeetings } = useRecentMeetings(5);
  const { data: stats } = useMeetingStats();

  const now = new Date();
  const sevenDaysOut = new Date(now.getTime() + 7 * 86_400_000);
  const { data: schedules } = useScheduledMeetings({
    from: now.toISOString(),
    to: sevenDaysOut.toISOString(),
    limit: 50,
  });

  const upcoming = (schedules?.items ?? [])
    .filter((s) => s.effectiveStatus !== "cancelled" && s.effectiveStatus !== "ended")
    .sort(
      (a, b) =>
        new Date(a.scheduledStartTime).getTime() - new Date(b.scheduledStartTime).getTime()
    )
    .slice(0, 4);

  const todayCount = upcoming.filter((s) => {
    const d = new Date(s.scheduledStartTime);
    return d.toDateString() === now.toDateString();
  }).length;

  const nextUp = upcoming[0];
  let nextLabel = "";
  if (nextUp) {
    const minsUntil = Math.round((new Date(nextUp.scheduledStartTime).getTime() - now.getTime()) / 60_000);
    if (minsUntil <= 0) nextLabel = "One is live now.";
    else if (minsUntil < 60) nextLabel = `The next starts in ${minsUntil} minute${minsUntil === 1 ? "" : "s"}.`;
    else if (minsUntil < 24 * 60) {
      const hrs = Math.round(minsUntil / 60);
      nextLabel = `The next starts in ${hrs} hour${hrs === 1 ? "" : "s"}.`;
    } else {
      nextLabel = `The next is on ${formatRelativeDate(nextUp.scheduledStartTime)}.`;
    }
  }
  const greetingSub = upcoming.length === 0
    ? "Nothing scheduled in the next 7 days. Start one anytime."
    : `You have ${todayCount} meeting${todayCount === 1 ? "" : "s"} today. ${nextLabel}`;

  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = user?.displayName?.split(" ")[0] ?? "there";

  const fmtDelta = (n: number): string => {
    if (n === 0) return "no change";
    const sign = n > 0 ? "+" : "−";
    return `${sign}${Math.abs(n)} vs last`;
  };
  const fmtHoursDelta = (n: number): string => {
    if (n === 0) return "no change";
    const sign = n > 0 ? "+" : "−";
    return `${sign}${Math.abs(n).toFixed(1)} vs last`;
  };

  const statCards = [
    {
      label: "Meetings this week",
      value: stats ? String(stats.meetingsThisWeek.value) : null,
      sub: stats ? fmtDelta(stats.meetingsThisWeek.delta) : "",
    },
    {
      label: "Hours captured",
      value: stats ? stats.hoursThisWeek.value.toFixed(1) : null,
      sub: stats ? fmtHoursDelta(stats.hoursThisWeek.delta) : "",
    },
    {
      label: "Notes generated",
      value: stats ? String(stats.notesGenerated.value) : null,
      sub: stats && stats.notesGenerated.total > 0
        ? `${Math.round((stats.notesGenerated.value / stats.notesGenerated.total) * 100)}% success`
        : (stats ? "no transcripts yet" : ""),
    },
    {
      label: "Avg meeting length",
      value: stats ? `${stats.avgMeetingMin.value}` : null,
      sub: stats ? "minutes" : "",
    },
  ];

  return (
    <div className="px-4 sm:px-6 md:px-8 py-5 sm:py-7 max-w-[1240px] mx-auto flex flex-col gap-6 sm:gap-8">
      {/* Greeting */}
      <div>
        <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-tertiary">
          {dateStr}
        </div>
        <h1 className="text-[22px] sm:text-[28px] font-semibold tracking-[-0.025em] font-display mt-1 text-foreground">
          {greeting}, {firstName}.
        </h1>
        <p className="text-[13px] sm:text-[14px] text-secondary mt-1.5">{greetingSub}</p>
      </div>

      {/* Start meeting hero */}
      <div className="relative rounded-[14px] overflow-hidden bg-[linear-gradient(180deg,#111_0%,#1a1a19_100%)] text-white shadow-[0_20px_40px_rgba(0,0,0,0.12),0_2px_6px_rgba(0,0,0,0.05)]">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)",
            backgroundSize: "14px 14px",
          }}
        />
        <div className="relative p-5 sm:p-7 md:p-9 flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-8">
          <div className="flex-1">
            <div className="inline-flex items-center gap-[7px] px-2.5 py-[3px] rounded-full bg-white/[0.08] text-white/85 text-[11px] font-medium tracking-[0.04em]">
              <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_0_3px_rgba(255,255,255,0.15)]" />
              Ready when you are
            </div>
            <h2 className="text-[24px] sm:text-[28px] md:text-[32px] font-semibold tracking-[-0.03em] font-display mt-3 sm:mt-3.5 text-white leading-[1.05]">
              Start a meeting.
            </h2>
            <p className="mt-2 text-[13px] sm:text-[13.5px] text-white/60 max-w-[380px]">
              We'll record, transcribe and write the notes. You stay in the conversation.
            </p>
            <div className="flex flex-col xs:flex-row gap-2.5 mt-5 sm:mt-6">
              <button
                onClick={openStartMeeting}
                className="h-10 sm:h-11 px-4 sm:px-5 rounded-[10px] bg-white text-[#111] font-medium text-[14px] sm:text-[15px] inline-flex items-center justify-center gap-2 border border-white hover:shadow-[0_8px_24px_rgba(255,255,255,0.15)] transition-shadow duration-200 active:scale-[0.98]"
              >
                <Icon name="play" size={11} /> Start meeting
              </button>
              <button
                onClick={openScheduleMeeting}
                className="h-10 sm:h-11 px-4 sm:px-5 rounded-[10px] bg-transparent text-white font-medium text-[14px] sm:text-[15px] inline-flex items-center justify-center gap-2 border border-white/[0.18] hover:border-white/30 transition-colors duration-150"
              >
                <Icon name="plus" size={13} /> Schedule
              </button>
            </div>
            <div className="mt-4 sm:mt-[22px] flex flex-wrap gap-3 sm:gap-4 text-[11px] sm:text-[11.5px] text-white/50">
              <span className="flex items-center gap-1.5">
                <span className="w-[5px] h-[5px] rounded-full bg-white/40" /> Auto-record
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-[5px] h-[5px] rounded-full bg-white/40" /> Timestamped transcript
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-[5px] h-[5px] rounded-full bg-white/40" /> AI notes via Gemini
              </span>
            </div>
          </div>

          {/* Preview panel — decorative, mirrors real transcript shape */}
          <div className="w-[260px] self-stretch bg-white/[0.04] border border-white/[0.08] rounded-xl p-[18px] flex-col hidden lg:flex">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] tracking-[0.08em] uppercase px-[7px] py-[3px] rounded bg-white/[0.08] text-white/70">
                Transcript
              </span>
              <span className="text-[11px] text-white/50 font-mono">EN · nova-2</span>
            </div>
            <div className="flex flex-col gap-2 flex-1">
              {[
                { t: "00:00:08", txt: "Welcome back everyone, let's run through the ship checklist." },
                { t: "00:00:21", txt: "Staging deploy is green. Logs look clean across all regions." },
                { t: "00:00:34", txt: "We're shipping behind the flag tonight. Cut at 8 PM local.", live: true },
              ].map((m, i) => (
                <div
                  key={i}
                  className={`px-2.5 py-2 rounded-lg ${m.live ? "bg-white/[0.06] border border-white/[0.08]" : "border border-transparent"}`}
                >
                  <div className="text-[10.5px] text-white/55 font-mono tracking-[0.02em]">{m.t}</div>
                  <div className="text-[11.5px] text-white/85 mt-[3px] leading-[1.45]">{m.txt}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 px-2.5 py-2 rounded-lg bg-white/[0.04] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span className="text-[11px] text-white/70">Capturing audio...</span>
              <span className="flex-1" />
              <Icon name="mic" size={12} className="text-white/50" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="bg-surface border border-border rounded-[14px] shadow-sm grid grid-cols-2 md:grid-cols-4">
        {statCards.map((s, i) => (
          <div
            key={i}
            className={`py-3.5 sm:py-[18px] px-4 sm:px-[22px] ${
              i < 3 ? "md:border-r md:border-border" : ""
            } ${i % 2 === 0 ? "border-r border-border md:border-r" : ""} ${
              i < 2 ? "border-b border-border md:border-b-0" : ""
            }`}
          >
            <div className="text-[10px] sm:text-[11px] text-tertiary uppercase tracking-[0.08em] font-medium">
              {s.label}
            </div>
            <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 min-h-[34px] sm:min-h-[40px]">
              {s.value === null ? (
                <div className="flex items-center gap-2 text-tertiary">
                  <Icon name="lock" size={18} />
                  <span className="text-[11px] sm:text-[12px]">Unlocking...</span>
                </div>
              ) : (
                <>
                  <div className="text-[22px] sm:text-[28px] font-semibold tracking-[-0.02em] tabular-nums text-foreground leading-none">
                    {s.value}
                  </div>
                  <div className="text-[10.5px] sm:text-[11.5px] text-tertiary">{s.sub}</div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming */}
      <div>
        <div className="flex items-center justify-between mb-3 sm:mb-3.5">
          <div>
            <h2 className="text-[16px] sm:text-[17px] font-semibold tracking-[-0.015em] font-display text-foreground">
              Upcoming
            </h2>
            <div className="text-[12px] sm:text-[12.5px] text-tertiary mt-[3px]">Next 7 days</div>
          </div>
          <button
            onClick={() => navigate("/schedules")}
            className="h-[30px] px-[11px] rounded-lg text-[13px] font-medium text-foreground hover:bg-hover transition-colors inline-flex items-center gap-1"
          >
            All <Icon name="arrowRight" size={11} />
          </button>
        </div>
        {upcoming.length === 0 ? (
          <div className="bg-surface border border-border rounded-[14px] shadow-sm px-5 py-8 text-center">
            <div className="text-[14px] text-secondary">No upcoming meetings in the next 7 days.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
            {upcoming.map((m) => (
              <UpcomingCard key={m.id} m={m} />
            ))}
          </div>
        )}
      </div>

      {/* Recent meetings */}
      <div>
        <div className="flex items-center justify-between mb-3 sm:mb-3.5">
          <div>
            <h2 className="text-[16px] sm:text-[17px] font-semibold tracking-[-0.015em] font-display text-foreground">
              Recent meetings
            </h2>
            <div className="text-[12px] sm:text-[12.5px] text-tertiary mt-[3px]">Notes ready to read</div>
          </div>
          <button
            onClick={() => navigate("/history")}
            className="h-[30px] px-[11px] rounded-lg text-[13px] font-medium text-foreground hover:bg-hover transition-colors inline-flex items-center gap-1"
          >
            View all <Icon name="arrowRight" size={11} />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {loadingMeetings && (
            <div className="text-[13px] text-tertiary py-4 text-center">Loading meetings...</div>
          )}
          {!loadingMeetings && recentMeetings.length === 0 && (
            <div className="bg-surface border border-border rounded-[14px] shadow-sm px-5 py-8 text-center">
              <div className="text-[14px] text-secondary">No meetings yet. Start your first meeting above!</div>
            </div>
          )}
          {recentMeetings.map((m) => (
            <MeetingRow key={m.id} m={m} />
          ))}
        </div>
      </div>
    </div>
  );
}
