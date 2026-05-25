import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSocketContext } from "../contexts/SocketContext";
import { useModals } from "../contexts/ModalContext";
import { Icon } from "../components/shell/Icon";
import { AvatarGroup } from "../components/shell/Avatar";
import { fetchMeetings, type MeetingSummary } from "../services/meetings";
import type { TranscriptReadyPayload } from "../types/index";

interface UpcomingMeeting {
  id: string;
  title: string;
  date: string;
  time: string;
  dow: string;
  day: string;
  participants: string[];
  status?: "live";
}

const UPCOMING: UpcomingMeeting[] = [
  { id: "u1", title: "Q3 Launch Readiness", date: "Today", time: "11:00 — 11:45", dow: "Tue", day: "14", participants: ["Sara Kim", "Diego Ortiz", "Mei Tanaka", "Alex Reyes"], status: "live" },
  { id: "u2", title: "Weekly 1:1 — Sara", date: "Today", time: "14:00 — 14:30", dow: "Tue", day: "14", participants: ["Sara Kim", "Alex Reyes"] },
  { id: "u3", title: "Customer Discovery — Halcyon", date: "Tomorrow", time: "09:30 — 10:15", dow: "Wed", day: "15", participants: ["Priya Shah", "Diego Ortiz", "Alex Reyes"] },
  { id: "u4", title: "Design Review · Notes editor", date: "Thu, May 16", time: "15:00 — 16:00", dow: "Thu", day: "16", participants: ["Mei Tanaka", "Diego Ortiz", "Alex Reyes"] },
];

const STATS = [
  { label: "Meetings this week", value: "12", sub: "+3 vs last" },
  { label: "Hours captured", value: "8.4", sub: "−1.1 vs last" },
  { label: "Action items", value: "38", sub: "24 open" },
  { label: "Notes generated", value: "11", sub: "92% success" },
];

function UpcomingCard({ m }: { m: UpcomingMeeting }) {
  return (
    <div className="bg-surface border border-border rounded-[14px] shadow-sm p-4 sm:p-5 flex flex-col gap-3 sm:gap-4 transition-shadow duration-150 hover:shadow-md min-h-[180px] sm:min-h-[200px]">
      <div className="flex items-start gap-3">
        <div className="w-12 sm:w-14 py-2 sm:py-2.5 rounded-[10px] bg-surface-hover border border-border flex flex-col items-center shrink-0">
          <div className="text-[10px] sm:text-[10.5px] tracking-[0.06em] text-tertiary uppercase font-medium">{m.dow}</div>
          <div className="text-[20px] sm:text-[22px] font-semibold text-foreground tabular-nums">{m.day}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13.5px] sm:text-[14.5px] font-semibold text-foreground overflow-hidden text-ellipsis whitespace-nowrap">
            {m.title}
          </div>
          <div className="text-[11.5px] sm:text-[12px] text-secondary mt-1">{m.date} · {m.time}</div>
        </div>
        {m.status === "live" && (
          <span className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-[3px] rounded-full bg-surface-hover border border-border text-[10px] sm:text-[11px] font-medium text-secondary whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_0_3px_rgba(22,163,74,0.15)]" />
            <span className="hidden xs:inline">Live in </span>12m
          </span>
        )}
      </div>

      <div className="flex-1" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AvatarGroup names={m.participants} size={22} max={3} />
          <span className="text-[11px] sm:text-[11.5px] text-tertiary">{m.participants.length} guests</span>
        </div>
        <button className="h-[30px] px-[11px] rounded-lg bg-accent text-accent-foreground font-medium text-[13px] inline-flex items-center gap-1.5 border border-accent hover:bg-black transition-all duration-150 active:scale-[0.98]">
          <Icon name="video" size={12} /> Join
        </button>
      </div>
    </div>
  );
}

function formatDuration(ms?: number): string {
  if (!ms) return "";
  const totalMin = Math.round(ms / 60000);
  if (totalMin < 60) return `${totalMin}m`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatWhen(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short" }) +
    " · " +
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function TranscriptBadge({ status }: { status: string | null }) {
  if (status === "completed") {
    return (
      <span className="shrink-0 px-2.5 py-[3px] rounded-full bg-[#22c55e]/10 text-[#22c55e] text-[11px] font-medium">
        Transcript ready
      </span>
    );
  }
  if (status === "processing") {
    return (
      <span className="shrink-0 px-2.5 py-[3px] rounded-full bg-amber-500/10 text-amber-400 text-[11px] font-medium">
        Processing...
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="shrink-0 px-2.5 py-[3px] rounded-full bg-[#dc2626]/10 text-[#f87171] text-[11px] font-medium">
        Failed
      </span>
    );
  }
  return null;
}

function RecentRow({ m }: { m: MeetingSummary }) {
  return (
    <div className="bg-surface border border-border rounded-[14px] shadow-sm px-4 sm:px-[18px] py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 transition-colors duration-[120ms] hover:bg-surface-hover cursor-pointer">
      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-surface-hover border border-border flex items-center justify-center text-secondary shrink-0">
          <Icon name="fileText" size={15} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[13.5px] sm:text-[14px] font-semibold text-foreground overflow-hidden text-ellipsis whitespace-nowrap">
              {m.title || "Untitled Meeting"}
            </span>
            <TranscriptBadge status={m.transcriptStatus} />
          </div>
          <div className="text-[11.5px] sm:text-[12px] text-tertiary mt-[3px]">
            {formatWhen(m.startedAt)}
            {m.durationMs ? ` · ${formatDuration(m.durationMs)}` : ""}
            {` · ${m.participantCount} attendees`}
          </div>
        </div>
      </div>
    </div>
  );
}

export function HomePage() {
  const { user } = useAuth();
  const { socket } = useSocketContext();
  const { openStartMeeting, openScheduleMeeting } = useModals();
  const [recentMeetings, setRecentMeetings] = useState<MeetingSummary[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(true);

  useEffect(() => {
    fetchMeetings(10)
      .then(setRecentMeetings)
      .catch((err) => console.error("Failed to load meetings:", err))
      .finally(() => setLoadingMeetings(false));
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleTranscriptReady = (payload: TranscriptReadyPayload) => {
      setRecentMeetings((prev) => {
        const exists = prev.some((m) => m.id === payload.meetingId);
        if (!exists) {
          fetchMeetings(10).then(setRecentMeetings).catch(console.error);
          return prev;
        }
        return prev.map((m) =>
          m.id === payload.meetingId
            ? { ...m, transcriptStatus: payload.status }
            : m
        );
      });
    };

    socket.on("transcript-ready", handleTranscriptReady);
    return () => {
      socket.off("transcript-ready", handleTranscriptReady);
    };
  }, [socket]);

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = user?.displayName?.split(" ")[0] ?? "there";

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
        <p className="text-[13px] sm:text-[14px] text-secondary mt-1.5">
          You have 3 meetings today. The first starts in 12 minutes.
        </p>
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
                <span className="w-[5px] h-[5px] rounded-full bg-white/40" /> Speaker labels
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-[5px] h-[5px] rounded-full bg-white/40" /> Notes in &lt;60s
              </span>
            </div>
          </div>

          {/* Preview panel — hidden below lg */}
          <div className="w-[260px] self-stretch bg-white/[0.04] border border-white/[0.08] rounded-xl p-[18px] flex-col hidden lg:flex">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] tracking-[0.08em] uppercase px-[7px] py-[3px] rounded bg-white/[0.08] text-white/70">
                Preview
              </span>
              <span className="text-[11px] text-white/50 font-mono">00:14:32</span>
            </div>
            <div className="flex flex-col gap-2 flex-1">
              {[
                { who: "Sara Kim", txt: "Let's confirm the August 14 ship date — anything blocking?" },
                { who: "Diego Ortiz", txt: "Two P0s remain. I'll have the playbook by Monday." },
                { who: "Mei Tanaka", txt: "Marketing copy locks Friday, per Sara.", live: true },
              ].map((m, i) => (
                <div
                  key={i}
                  className={`px-2.5 py-2 rounded-lg ${m.live ? "bg-white/[0.06] border border-white/[0.08]" : "border border-transparent"}`}
                >
                  <div className="text-[10.5px] text-white/55 font-medium tracking-[0.02em]">{m.who}</div>
                  <div className="text-[11.5px] text-white/85 mt-[3px] leading-[1.45]">{m.txt}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 px-2.5 py-2 rounded-lg bg-white/[0.04] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span className="text-[11px] text-white/70">Listening...</span>
              <span className="flex-1" />
              <Icon name="mic" size={12} className="text-white/50" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="bg-surface border border-border rounded-[14px] shadow-sm grid grid-cols-2 md:grid-cols-4">
        {STATS.map((s, i) => (
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
            <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
              <div className="text-[22px] sm:text-[28px] font-semibold tracking-[-0.02em] tabular-nums text-foreground">
                {s.value}
              </div>
              <div className="text-[10.5px] sm:text-[11.5px] text-tertiary">{s.sub}</div>
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
          <div className="flex items-center gap-1.5">
            <button className="h-[30px] px-[11px] rounded-lg text-[13px] font-medium text-foreground hover:bg-hover transition-colors hidden sm:inline-flex">
              This week
            </button>
            <button className="h-[30px] px-[11px] rounded-lg text-[13px] font-medium text-foreground hover:bg-hover transition-colors inline-flex items-center gap-1">
              All <Icon name="arrowRight" size={11} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
          {UPCOMING.map((m) => (
            <UpcomingCard key={m.id} m={m} />
          ))}
        </div>
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
          <button className="h-[30px] px-[11px] rounded-lg text-[13px] font-medium text-foreground hover:bg-hover transition-colors inline-flex items-center gap-1">
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
            <RecentRow key={m.id} m={m} />
          ))}
        </div>
      </div>
    </div>
  );
}
