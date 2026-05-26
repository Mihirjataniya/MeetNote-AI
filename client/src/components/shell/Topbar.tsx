import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/useAuthStore";
import { useUIStore } from "../../stores/useUIStore";
import { Icon } from "./Icon";
import { Avatar } from "./Avatar";

const pageLabels: Record<string, string> = {
  "/home": "Home",
  "/schedules": "Schedules",
  "/history": "Meeting Histories",
  "/settings": "Settings",
  "/profile": "Profile",
};

export function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setMobileOpen = useUIStore((s) => s.setMobileSidebarOpen);
  const currentLabel = pageLabels[location.pathname] ?? "Home";

  return (
    <header className="h-14 px-4 md:px-7 flex items-center gap-3 md:gap-4 border-b border-border bg-background shrink-0">
      {/* Hamburger — mobile only */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden w-8 h-8 rounded-lg inline-flex items-center justify-center text-foreground hover:bg-hover transition-colors"
      >
        <Icon name="menu" size={18} />
      </button>

      <div className="flex items-center gap-2 text-[13px]">
        <span className="text-secondary hidden sm:inline">Workspace</span>
        <span className="text-muted hidden sm:inline">/</span>
        <span className="text-foreground font-medium">{currentLabel}</span>
      </div>

      <div className="flex-1" />

      <div className="relative hidden sm:block w-[200px] lg:w-[260px]">
        <Icon
          name="search"
          size={14}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-tertiary pointer-events-none"
        />
        <input
          className="w-full h-[34px] pl-[30px] pr-14 text-[13px] rounded-[10px] bg-surface-hover border border-transparent outline-none transition-all duration-150 focus:border-border-focused focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)] placeholder:text-tertiary"
          placeholder="Search meetings, notes..."
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[11px] px-1.5 py-0.5 rounded-[5px] bg-surface border border-border-strong text-secondary shadow-[0_1px_0_var(--border-strong)] hidden lg:inline">
          ⌘K
        </span>
      </div>

      {/* Mobile search button */}
      <button
        className="sm:hidden w-8 h-8 rounded-lg inline-flex items-center justify-center text-secondary hover:bg-hover transition-colors"
        title="Search"
      >
        <Icon name="search" size={16} />
      </button>

      <button
        className="relative w-[34px] h-[34px] rounded-[10px] inline-flex items-center justify-center hover:bg-hover transition-colors duration-150"
        title="Notifications"
      >
        <Icon name="bell" size={16} />
        <span className="absolute top-1.5 right-1.5 w-[7px] h-[7px] rounded-full bg-foreground shadow-[0_0_0_2px_var(--background)]" />
      </button>

      <button
        onClick={() => navigate("/profile")}
        className="bg-transparent border-none p-0 cursor-pointer hidden sm:block"
      >
        <Avatar name={user?.displayName ?? ""} size={30} />
      </button>
    </header>
  );
}
