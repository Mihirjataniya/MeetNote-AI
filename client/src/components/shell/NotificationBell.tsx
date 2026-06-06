import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "./Icon";
import {
  useNotifications,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  type NotificationItem,
} from "../../queries/useNotificationsQuery";

const TYPE_ICON: Record<NotificationItem["type"], string> = {
  "transcript-ready": "check",
  "transcript-failed": "x",
  "notes-ready": "sparkle",
  "notes-failed": "x",
  "meeting-invited": "calendar",
  "meeting-updated": "edit",
  "meeting-cancelled": "x",
  "meeting-series-cancelled": "x",
  "meeting-started": "play",
  "join-request-missed": "users",
};

const TYPE_TINT: Record<NotificationItem["type"], string> = {
  "transcript-ready": "text-emerald-500 bg-emerald-500/10",
  "transcript-failed": "text-[#f87171] bg-[#dc2626]/10",
  "notes-ready": "text-blue-500 bg-blue-500/10",
  "notes-failed": "text-[#f87171] bg-[#dc2626]/10",
  "meeting-invited": "text-secondary bg-surface-hover",
  "meeting-updated": "text-secondary bg-surface-hover",
  "meeting-cancelled": "text-amber-500 bg-amber-500/10",
  "meeting-series-cancelled": "text-amber-500 bg-amber-500/10",
  "meeting-started": "text-emerald-500 bg-emerald-500/10",
  "join-request-missed": "text-amber-500 bg-amber-500/10",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.round(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function routeFor(n: NotificationItem): string {
  switch (n.type) {
    case "transcript-ready":
    case "transcript-failed":
    case "notes-ready":
    case "notes-failed":
      return "/history";
    case "meeting-invited":
    case "meeting-updated":
    case "meeting-cancelled":
    case "meeting-series-cancelled":
    case "meeting-started":
      return "/schedules";
    case "join-request-missed":
      return n.roomId ? `/room/${n.roomId}?host=1` : "/home";
    default:
      return "/home";
  }
}

export function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const { data: unread = 0 } = useUnreadCount();
  const { data: page, isLoading } = useNotifications(1, 15);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  const notifications = page?.notifications ?? [];

  function handleNotificationClick(n: NotificationItem) {
    if (!n.readAt) markRead.mutate(n.id);
    setOpen(false);
    navigate(routeFor(n));
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-[34px] h-[34px] rounded-[10px] inline-flex items-center justify-center hover:bg-hover transition-colors duration-150"
        title="Notifications"
      >
        <Icon name="bell" size={16} />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-[#dc2626] text-white text-[10px] font-semibold inline-flex items-center justify-center shadow-[0_0_0_2px_var(--background)] tabular-nums">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-[42px] w-[360px] max-w-[calc(100vw-32px)] bg-surface border border-border rounded-[14px] shadow-lg z-50 overflow-hidden flex flex-col"
          style={{ animation: "pop-in 0.18s ease" }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="text-[13.5px] font-semibold text-foreground">
              Notifications
            </div>
            {unread > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="text-[11.5px] text-secondary hover:text-foreground transition-colors disabled:opacity-50"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[440px] overflow-y-auto">
            {isLoading && (
              <div className="px-4 py-8 text-center text-[12.5px] text-tertiary">
                Loading…
              </div>
            )}
            {!isLoading && notifications.length === 0 && (
              <div className="px-4 py-10 text-center">
                <div className="w-10 h-10 mx-auto rounded-xl bg-surface-hover border border-border flex items-center justify-center text-tertiary mb-3">
                  <Icon name="bell" size={16} />
                </div>
                <div className="text-[13px] text-secondary font-medium">
                  You're all caught up
                </div>
                <div className="text-[11.5px] text-tertiary mt-1">
                  Notifications about meetings and notes will appear here.
                </div>
              </div>
            )}
            {notifications.map((n) => {
              const isUnread = !n.readAt;
              return (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full text-left flex items-start gap-3 px-4 py-3 border-b border-border last:border-b-0 transition-colors hover:bg-surface-hover ${
                    isUnread ? "bg-accent/[0.04]" : ""
                  }`}
                >
                  <div
                    className={`shrink-0 w-8 h-8 rounded-lg inline-flex items-center justify-center ${TYPE_TINT[n.type]}`}
                  >
                    <Icon name={TYPE_ICON[n.type]} size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <div className="text-[12.5px] font-semibold text-foreground leading-snug flex-1">
                        {n.title}
                      </div>
                      {isUnread && (
                        <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-accent mt-[6px]" />
                      )}
                    </div>
                    {n.body && (
                      <div className="text-[11.5px] text-secondary mt-0.5 leading-snug overflow-hidden text-ellipsis whitespace-nowrap">
                        {n.body}
                      </div>
                    )}
                    <div className="text-[10.5px] text-tertiary mt-1">
                      {timeAgo(n.createdAt)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
