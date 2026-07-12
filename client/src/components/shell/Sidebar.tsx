import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../stores/useAuthStore";
import { useUIStore } from "../../stores/useUIStore";
import { usePinnedMeetings } from "../../queries/useMeetingsQuery";
import { useScheduledMeetings } from "../../queries/useSchedulesQuery";
import { fetchMeetingNotes, type PinnedMeetingSummary } from "../../services/meetings";
import { Icon } from "./Icon";
import { Avatar } from "./Avatar";

function PinnedItem({
  meeting,
  onNavigate,
}: {
  meeting: PinnedMeetingSummary;
  onNavigate: (to: string) => void;
}) {
  const [busy, setBusy] = useState(false);

  const isScheduled = meeting.status === "scheduled";
  const isActive = meeting.status === "active";
  const hasNotes = meeting.notesStatus === "completed";

  // Decide the right action — scheduled → schedules page, live → jump in,
  // notes ready → download, otherwise → history.
  let actionLabel: string;
  let actionIcon: string;
  if (isActive) {
    actionLabel = "Join live meeting";
    actionIcon = "video";
  } else if (isScheduled) {
    actionLabel = "Go to scheduled meeting";
    actionIcon = "calendar";
  } else if (hasNotes) {
    actionLabel = busy ? "Preparing PDF…" : "Download notes";
    actionIcon = busy ? "spinner" : "sparkle";
  } else {
    actionLabel = "Open meeting history";
    actionIcon = "history";
  }

  async function handleClick() {
    if (busy) return;
    if (isActive) {
      const hostQuery = meeting.isHost ? "&host=1" : "";
      onNavigate(`/room/${meeting.roomId}?scheduledMeetingId=${meeting.id}${hostQuery}`);
      return;
    }
    if (isScheduled) {
      onNavigate("/schedules");
      return;
    }
    if (hasNotes) {
      setBusy(true);
      try {
        const md = await fetchMeetingNotes(meeting.id);
        const { downloadNotesPdf } = await import("../../utils/notesPdf");
        await downloadNotesPdf(md, meeting.title);
      } catch (err) {
        console.error("Notes download failed:", err);
      } finally {
        setBusy(false);
      }
      return;
    }
    onNavigate("/history");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      title={`${meeting.title || "Untitled meeting"} · ${actionLabel}`}
      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13.5px] font-medium text-secondary hover:bg-hover hover:text-foreground transition-all duration-[120ms] disabled:opacity-60 disabled:cursor-not-allowed text-left w-full"
    >
      <Icon
        name={actionIcon}
        size={13}
        className={busy ? "animate-spin" : undefined}
      />
      <span className="overflow-hidden text-ellipsis whitespace-nowrap flex-1">
        {meeting.title || "Untitled meeting"}
      </span>
      {isActive && (
        <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626] shadow-[0_0_0_3px_rgba(220,38,38,0.15)] shrink-0" />
      )}
    </button>
  );
}

function SidebarContent() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const openStartMeeting = useUIStore((s) => s.openStartMeeting);
  const openScheduleMeeting = useUIStore((s) => s.openScheduleMeeting);
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleCollapsed = useUIStore((s) => s.toggleSidebarCollapsed);
  const setMobileOpen = useUIStore((s) => s.setMobileSidebarOpen);

  const closeMobile = () => setMobileOpen(false);

  const { data: pinned = [] } = usePinnedMeetings(8);

  // Live count of upcoming meetings in the next 7 days (non-cancelled, non-ended).
  // useMemo so the from/to don't shift every render and cause query thrash.
  const scheduleRange = useMemo(() => {
    const now = new Date();
    const to = new Date(now.getTime() + 7 * 86_400_000);
    return { from: now.toISOString(), to: to.toISOString(), limit: 100 };
  }, []);
  const { data: schedulesData } = useScheduledMeetings(scheduleRange);
  const upcomingCount = (schedulesData?.items ?? []).filter(
    (s) => s.effectiveStatus !== "cancelled" && s.effectiveStatus !== "ended"
  ).length;

  const navItems: Array<{ to: string; label: string; icon: string; count?: number }> = [
    { to: "/home", label: "Home", icon: "home" },
    { to: "/schedules", label: "Schedules", icon: "calendar", count: upcomingCount },
    { to: "/history", label: "Meeting Histories", icon: "history" },
    { to: "/settings", label: "Settings", icon: "settings" },
  ];

  return (
    <aside className="bg-background border-r border-border flex flex-col py-[18px] px-[14px] h-full overflow-y-auto overflow-x-hidden">
      {/* Header */}
      <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
        <span className={`inline-flex items-center gap-[9px] font-semibold text-[15px] tracking-[-0.02em] text-foreground ${collapsed ? "justify-center" : ""}`}>
          <span className="w-[22px] h-[22px] rounded-[6px] bg-accent text-accent-foreground inline-flex items-center justify-center font-display text-[13px] font-bold shrink-0">
            M
          </span>
          {!collapsed && <span>MeetNote Ai</span>}
        </span>
        <button
          onClick={toggleCollapsed}
          className="hidden md:inline-flex w-6 h-6 rounded-md items-center justify-center text-tertiary hover:bg-hover hover:text-foreground transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Icon name={collapsed ? "panelLeftOpen" : "panelLeftClose"} size={14} />
        </button>
        <button
          onClick={closeMobile}
          className="md:hidden inline-flex w-7 h-7 rounded-md items-center justify-center text-tertiary hover:bg-hover hover:text-foreground transition-colors"
          title="Close menu"
          aria-label="Close menu"
        >
          <Icon name="x" size={16} />
        </button>
      </div>

      {/* Action buttons */}
      {collapsed ? (
        <div className="flex flex-col items-center gap-2 mt-[18px]">
          <button
            onClick={() => { openStartMeeting(); closeMobile(); }}
            className="w-9 h-9 rounded-[10px] bg-accent text-accent-foreground inline-flex items-center justify-center border border-accent hover:brightness-90 transition-all duration-150 active:scale-[0.98]"
            title="Start meeting"
          >
            <Icon name="play" size={12} />
          </button>
          <button
            onClick={() => { openScheduleMeeting(); closeMobile(); }}
            className="w-9 h-9 rounded-lg border border-border-strong bg-surface text-foreground inline-flex items-center justify-center hover:bg-surface-hover hover:border-border-focused transition-all duration-150 active:scale-[0.98]"
            title="Schedule"
          >
            <Icon name="plus" size={13} />
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={() => { openStartMeeting(); closeMobile(); }}
            className="mt-[18px] h-9 px-4 rounded-[10px] bg-accent text-accent-foreground font-medium text-[14px] inline-flex items-center justify-center gap-2 border border-accent hover:brightness-90 transition-all duration-150 active:scale-[0.98]"
          >
            <Icon name="play" size={12} /> Start meeting
          </button>
          <button
            onClick={() => { openScheduleMeeting(); closeMobile(); }}
            className="mt-2 h-8 px-[11px] rounded-lg border border-border-strong bg-surface text-foreground font-medium text-[13px] inline-flex items-center justify-center gap-1.5 hover:bg-surface-hover hover:border-border-focused transition-all duration-150 active:scale-[0.98]"
          >
            <Icon name="plus" size={13} /> Schedule
          </button>
        </>
      )}

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 mt-[18px]">
        {!collapsed && (
          <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-tertiary px-2.5 pt-3.5 pb-1.5">
            Workspace
          </div>
        )}
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={closeMobile}
            className={({ isActive }) =>
              `flex items-center ${collapsed ? "justify-center" : "gap-2.5"} ${collapsed ? "p-2" : "px-2.5 py-2"} rounded-lg text-[13.5px] font-medium transition-all duration-[120ms] ${
                isActive
                  ? "bg-surface text-foreground shadow-sm"
                  : "text-secondary hover:bg-hover hover:text-foreground"
              }`
            }
            title={collapsed ? item.label : undefined}
          >
            <Icon name={item.icon} size={15} />
            {!collapsed && (
              <>
                <span>{item.label}</span>
                {typeof item.count === "number" && item.count > 0 && (
                  <span className="ml-auto text-[11px] text-tertiary tabular-nums">
                    {item.count}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Pinned */}
      {!collapsed && (
        <nav className="flex flex-col gap-0.5 mt-[18px]">
          <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-tertiary px-2.5 pt-[18px] pb-1.5">
            Pinned
          </div>
          {pinned.length === 0 ? (
            <div className="px-2.5 py-2 text-[12px] text-tertiary leading-relaxed">
              Pin a meeting or schedule to quick-access it here.
            </div>
          ) : (
            pinned.map((m) => (
              <PinnedItem
                key={m.id}
                meeting={m}
                onNavigate={(to) => {
                  navigate(to);
                  closeMobile();
                }}
              />
            ))
          )}
        </nav>
      )}

      <div className="flex-1" />

      {/* User card */}
      <div
        className={`bg-surface border border-border rounded-[14px] shadow-sm flex items-center cursor-pointer hover:bg-surface-hover transition-colors duration-[120ms] ${
          collapsed ? "p-2 justify-center" : "p-2.5 gap-2.5"
        }`}
        onClick={() => { navigate("/profile"); closeMobile(); }}
      >
        <Avatar name={user?.displayName ?? ""} size={collapsed ? 28 : 32} />
        {!collapsed && (
          <>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-foreground">{user?.displayName}</div>
              <div className="text-[11px] text-tertiary overflow-hidden text-ellipsis whitespace-nowrap">
                {user?.email}
              </div>
            </div>
            <Icon name="moreHorizontal" size={14} className="text-tertiary" />
          </>
        )}
      </div>
    </aside>
  );
}

export function Sidebar() {
  const mobileOpen = useUIStore((s) => s.mobileSidebarOpen);
  const setMobileOpen = useUIStore((s) => s.setMobileSidebarOpen);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, setMobileOpen]);

  return (
    <>
      {/* Desktop sidebar — in grid flow, hidden on mobile */}
      <div className="hidden md:block h-full overflow-hidden">
        <SidebarContent />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden" style={{ animation: "fade-in 0.18s ease" }}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
          <div
            className="relative w-[280px] h-full shadow-lg"
            style={{ animation: "slide-in-left 0.2s ease" }}
          >
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
}
