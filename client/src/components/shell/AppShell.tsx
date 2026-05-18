import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { Icon } from "./Icon";
import { ModalContext } from "../../contexts/ModalContext";
import { StartMeetingModal } from "../modals/StartMeetingModal";
import { ScheduleMeetingModal } from "../modals/ScheduleMeetingModal";

export function AppShell() {
  const [startOpen, setStartOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <ModalContext.Provider
      value={{
        openStartMeeting: () => setStartOpen(true),
        openScheduleMeeting: () => setScheduleOpen(true),
      }}
    >
      <div className="h-full grid grid-cols-[260px_1fr] bg-background">
        <Sidebar />
        <div className="flex flex-col min-h-0 overflow-hidden">
          <Topbar />
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <Outlet />
          </div>
        </div>

        <StartMeetingModal open={startOpen} onClose={() => setStartOpen(false)} />
        <ScheduleMeetingModal
          open={scheduleOpen}
          onClose={() => setScheduleOpen(false)}
          onConfirm={() => {
            setScheduleOpen(false);
            setToast("Meeting scheduled · invites sent");
          }}
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
    </ModalContext.Provider>
  );
}
