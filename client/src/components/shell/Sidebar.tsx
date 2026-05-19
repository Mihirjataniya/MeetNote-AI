import { useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useModals } from "../../contexts/ModalContext";
import { useSidebar } from "../../contexts/SidebarContext";
import { Icon } from "./Icon";
import { Avatar } from "./Avatar";

const navItems = [
  { to: "/home", label: "Home", icon: "home" },
  { to: "/schedules", label: "Schedules", icon: "calendar", count: "4" },
  { to: "/history", label: "Meeting Histories", icon: "history" },
  { to: "/settings", label: "Settings", icon: "settings" },
];

const pinnedItems = ["Q3 Roadmap", "Customer interviews", "Weekly 1:1 — Sara"];

function SidebarContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { openStartMeeting, openScheduleMeeting } = useModals();
  const { collapsed, toggleCollapsed, setMobileOpen } = useSidebar();

  const closeMobile = () => setMobileOpen(false);

  return (
    <aside className="bg-background border-r border-border flex flex-col py-[18px] px-[14px] h-full overflow-y-auto overflow-x-hidden">
      {/* Header */}
      <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
        <span className={`inline-flex items-center gap-[9px] font-semibold text-[15px] tracking-[-0.02em] text-foreground ${collapsed ? "justify-center" : ""}`}>
          <span className="w-[22px] h-[22px] rounded-[6px] bg-accent text-accent-foreground inline-flex items-center justify-center font-display text-[13px] font-bold shrink-0">
            M
          </span>
          {!collapsed && <span>MeetNote</span>}
        </span>
        <button
          onClick={toggleCollapsed}
          className="hidden md:inline-flex w-6 h-6 rounded-md items-center justify-center text-tertiary hover:bg-hover hover:text-foreground transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Icon name={collapsed ? "panelLeftOpen" : "panelLeftClose"} size={14} />
        </button>
      </div>

      {/* Action buttons */}
      {collapsed ? (
        <div className="flex flex-col items-center gap-2 mt-[18px]">
          <button
            onClick={() => { openStartMeeting(); closeMobile(); }}
            className="w-9 h-9 rounded-[10px] bg-accent text-accent-foreground inline-flex items-center justify-center border border-accent hover:bg-black transition-all duration-150 active:scale-[0.98]"
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
            className="mt-[18px] h-9 px-4 rounded-[10px] bg-accent text-accent-foreground font-medium text-[14px] inline-flex items-center justify-center gap-2 border border-accent hover:bg-black transition-all duration-150 active:scale-[0.98]"
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
                {"count" in item && item.count && (
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
          {pinnedItems.map((title) => (
            <div
              key={title}
              onClick={closeMobile}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13.5px] font-medium text-secondary hover:bg-hover hover:text-foreground transition-all duration-[120ms] cursor-pointer"
            >
              <Icon name="fileText" size={14} />
              <span className="overflow-hidden text-ellipsis whitespace-nowrap">{title}</span>
            </div>
          ))}
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
  const { mobileOpen, setMobileOpen } = useSidebar();
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
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
          />
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
