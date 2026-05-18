import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useModals } from "../../contexts/ModalContext";
import { Icon } from "./Icon";
import { Avatar } from "./Avatar";

const navItems = [
  { to: "/home", label: "Home", icon: "home" },
  { to: "/schedules", label: "Schedules", icon: "calendar", count: "4" },
  { to: "/history", label: "Meeting Histories", icon: "history" },
  { to: "/settings", label: "Settings", icon: "settings" },
];

const pinnedItems = ["Q3 Roadmap", "Customer interviews", "Weekly 1:1 — Sara"];

export function Sidebar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { openStartMeeting, openScheduleMeeting } = useModals();

  return (
    <aside className="bg-background border-r border-border flex flex-col py-[18px] px-[14px]">
      <span className="inline-flex items-center gap-[9px] font-semibold text-[15px] tracking-[-0.02em] text-foreground">
        <span className="w-[22px] h-[22px] rounded-[6px] bg-accent text-accent-foreground inline-flex items-center justify-center font-display text-[13px] font-bold">
          M
        </span>
        MeetNote
      </span>

      <button
        onClick={openStartMeeting}
        className="mt-[18px] h-9 px-4 rounded-[10px] bg-accent text-accent-foreground font-medium text-[14px] inline-flex items-center justify-center gap-2 border border-accent hover:bg-black transition-all duration-150 active:scale-[0.98]"
      >
        <Icon name="play" size={12} /> Start meeting
      </button>
      <button
        onClick={openScheduleMeeting}
        className="mt-2 h-8 px-[11px] rounded-lg border border-border-strong bg-surface text-foreground font-medium text-[13px] inline-flex items-center justify-center gap-1.5 hover:bg-surface-hover hover:border-border-focused transition-all duration-150 active:scale-[0.98]"
      >
        <Icon name="plus" size={13} /> Schedule
      </button>

      <nav className="flex flex-col gap-0.5 mt-[18px]">
        <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-tertiary px-2.5 pt-3.5 pb-1.5">
          Workspace
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13.5px] font-medium transition-all duration-[120ms] ${
                isActive
                  ? "bg-surface text-foreground shadow-sm"
                  : "text-secondary hover:bg-hover hover:text-foreground"
              }`
            }
          >
            <Icon name={item.icon} size={15} />
            <span>{item.label}</span>
            {"count" in item && item.count && (
              <span className="ml-auto text-[11px] text-tertiary tabular-nums">
                {item.count}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <nav className="flex flex-col gap-0.5 mt-[18px]">
        <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-tertiary px-2.5 pt-[18px] pb-1.5">
          Pinned
        </div>
        {pinnedItems.map((title) => (
          <div
            key={title}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13.5px] font-medium text-secondary hover:bg-hover hover:text-foreground transition-all duration-[120ms] cursor-pointer"
          >
            <Icon name="fileText" size={14} />
            <span className="overflow-hidden text-ellipsis whitespace-nowrap">{title}</span>
          </div>
        ))}
      </nav>

      <div className="flex-1" />

      <div
        className="bg-surface border border-border rounded-[14px] shadow-sm p-2.5 flex items-center gap-2.5 cursor-pointer hover:bg-surface-hover transition-colors duration-[120ms]"
        onClick={() => navigate("/profile")}
      >
        <Avatar name={user?.displayName ?? ""} size={32} />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-foreground">{user?.displayName}</div>
          <div className="text-[11px] text-tertiary overflow-hidden text-ellipsis whitespace-nowrap">
            {user?.email}
          </div>
        </div>
        <Icon name="moreHorizontal" size={14} className="text-tertiary" />
      </div>
    </aside>
  );
}
