import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { Icon } from "./Icon";
import { useUIStore } from "../../stores/useUIStore";
import { StartMeetingModal } from "../modals/StartMeetingModal";
import { ScheduleMeetingModal } from "../modals/ScheduleMeetingModal";

export function AppShell() {
  const [toast, setToast] = useState<string | null>(null);
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const startOpen = useUIStore((s) => s.startMeetingOpen);
  const scheduleOpen = useUIStore((s) => s.scheduleMeetingOpen);
  const closeStartMeeting = useUIStore((s) => s.closeStartMeeting);
  const closeScheduleMeeting = useUIStore((s) => s.closeScheduleMeeting);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div
      className="h-full grid bg-background transition-[grid-template-columns] duration-200 grid-cols-[1fr] md:grid-cols-[var(--sidebar-w)_1fr]"
      style={{ "--sidebar-w": sidebarCollapsed ? "60px" : "260px" } as React.CSSProperties}
    >
      <Sidebar />
      <div className="flex flex-col min-h-0 overflow-hidden">
        <Topbar />
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </div>
      </div>

      <StartMeetingModal open={startOpen} onClose={closeStartMeeting} />
      <ScheduleMeetingModal
        open={scheduleOpen}
        onClose={closeScheduleMeeting}
        onCreated={() => setToast("Meeting scheduled")}
      />

      {toast && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-[60] pointer-events-none">
          <div
            className="px-4 py-2.5 bg-foreground text-accent-foreground rounded-full text-[13px] font-medium shadow-lg flex items-center gap-2 pointer-events-auto"
            style={{ animation: "toast-in 0.25s ease" }}
          >
            <Icon name="check" size={13} /> {toast}
          </div>
        </div>
      )}
    </div>
  );
}
