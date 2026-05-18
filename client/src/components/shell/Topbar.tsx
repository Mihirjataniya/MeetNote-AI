import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
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
  const { user } = useAuth();
  const currentLabel = pageLabels[location.pathname] ?? "Home";

  return (
    <header className="h-14 px-7 flex items-center gap-4 border-b border-border bg-background shrink-0">
      <div className="flex items-center gap-2 text-[13px]">
        <span className="text-secondary">Workspace</span>
        <span className="text-muted">/</span>
        <span className="text-foreground font-medium">{currentLabel}</span>
      </div>

      <div className="flex-1" />

      <div className="relative w-[260px]">
        <Icon
          name="search"
          size={14}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-tertiary pointer-events-none"
        />
        <input
          className="w-full h-[34px] pl-[30px] pr-14 text-[13px] rounded-[10px] bg-surface-hover border border-transparent outline-none transition-all duration-150 focus:border-border-focused focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)] placeholder:text-tertiary"
          placeholder="Search meetings, notes..."
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[11px] px-1.5 py-0.5 rounded-[5px] bg-surface border border-border-strong text-secondary shadow-[0_1px_0_var(--border-strong)]">
          ⌘K
        </span>
      </div>

      <button
        className="relative w-[34px] h-[34px] rounded-[10px] inline-flex items-center justify-center hover:bg-hover transition-colors duration-150"
        title="Notifications"
      >
        <Icon name="bell" size={16} />
        <span className="absolute top-1.5 right-1.5 w-[7px] h-[7px] rounded-full bg-foreground shadow-[0_0_0_2px_var(--background)]" />
      </button>

      <button
        onClick={() => navigate("/profile")}
        className="bg-transparent border-none p-0 cursor-pointer"
      >
        <Avatar name={user?.displayName ?? ""} size={30} />
      </button>
    </header>
  );
}
