import { useMemo, useState } from "react";
import { Icon } from "../components/shell/Icon";
import { useUIStore } from "../stores/useUIStore";
import { useScheduledMeetings } from "../queries/useSchedulesQuery";
import { ScheduleListView } from "../components/schedules/ScheduleListView";
import { ScheduleMonthView } from "../components/schedules/ScheduleMonthView";
import { ScheduleMeetingModal } from "../components/modals/ScheduleMeetingModal";
import { EditScheduledMeetingModal } from "../components/modals/EditScheduledMeetingModal";
import { CancelMeetingDialog } from "../components/schedules/CancelMeetingDialog";
import type { ScheduledMeetingSummary } from "../services/schedules";

type ViewMode = "list" | "month";

export function SchedulesPage() {
  const scheduleOpen = useUIStore((s) => s.scheduleMeetingOpen);
  const openSchedule = useUIStore((s) => s.openScheduleMeeting);
  const closeSchedule = useUIStore((s) => s.closeScheduleMeeting);
  const [view, setView] = useState<ViewMode>("list");
  const [editTarget, setEditTarget] = useState<ScheduledMeetingSummary | null>(null);
  const [cancelTarget, setCancelTarget] = useState<ScheduledMeetingSummary | null>(null);

  const { data, isLoading, error } = useScheduledMeetings({ limit: 200 });
  const items = useMemo(() => data?.items ?? [], [data]);

  return (
    <div className="px-4 sm:px-6 md:px-8 py-5 sm:py-7 max-w-[1240px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] sm:text-[28px] font-semibold tracking-[-0.025em] font-display text-foreground">
            Schedules
          </h1>
          <p className="text-[13px] sm:text-[14px] text-secondary mt-1.5">
            Plan ahead. Anyone invited will see it here.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center bg-surface border border-border rounded-[10px] p-[3px]">
            <button
              onClick={() => setView("list")}
              className={`h-8 px-3 rounded-[7px] text-[12.5px] font-medium inline-flex items-center gap-1.5 transition-colors ${
                view === "list" ? "bg-surface-hover text-foreground" : "text-tertiary hover:text-secondary"
              }`}
            >
              <Icon name="list" size={12} /> List
            </button>
            <button
              onClick={() => setView("month")}
              className={`h-8 px-3 rounded-[7px] text-[12.5px] font-medium inline-flex items-center gap-1.5 transition-colors ${
                view === "month" ? "bg-surface-hover text-foreground" : "text-tertiary hover:text-secondary"
              }`}
            >
              <Icon name="grid" size={12} /> Month
            </button>
          </div>
          <button
            onClick={openSchedule}
            className="h-9 px-4 rounded-[10px] bg-accent text-accent-foreground font-medium text-[13.5px] inline-flex items-center gap-2 border border-accent hover:bg-accent/80 transition-all duration-150 active:scale-[0.98]"
          >
            <Icon name="plus" size={13} /> Schedule meeting
          </button>
        </div>
      </div>

      <div className="mt-6 sm:mt-8">
        {isLoading && (
          <div className="bg-surface border border-border rounded-[14px] shadow-sm p-8 text-center text-[13px] text-tertiary">
            Loading schedules...
          </div>
        )}
        {error && (
          <div className="bg-[#dc2626]/10 border border-[#dc2626]/20 rounded-[14px] p-4 text-[13px] text-[#fca5a5]">
            {error instanceof Error ? error.message : "Failed to load schedules"}
          </div>
        )}
        {!isLoading && !error && view === "list" && (
          <ScheduleListView meetings={items} onEdit={setEditTarget} onCancel={setCancelTarget} />
        )}
        {!isLoading && !error && view === "month" && (
          <ScheduleMonthView meetings={items} onEdit={setEditTarget} onCancel={setCancelTarget} />
        )}
      </div>

      <ScheduleMeetingModal open={scheduleOpen} onClose={closeSchedule} />
      <EditScheduledMeetingModal
        open={!!editTarget}
        meeting={editTarget}
        onClose={() => setEditTarget(null)}
      />
      <CancelMeetingDialog
        open={!!cancelTarget}
        meeting={cancelTarget}
        onClose={() => setCancelTarget(null)}
      />
    </div>
  );
}
