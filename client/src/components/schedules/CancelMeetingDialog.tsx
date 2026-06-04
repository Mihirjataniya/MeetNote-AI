import { useState } from "react";
import { Modal } from "../shell/Modal";
import {
  useCancelScheduledMeeting,
  useCancelScheduledSeries,
} from "../../queries/useScheduleMutations";
import type { ScheduledMeetingSummary } from "../../services/schedules";

interface Props {
  open: boolean;
  meeting: ScheduledMeetingSummary | null;
  onClose: () => void;
}

type Scope = "single" | "series";

export function CancelMeetingDialog({ open, meeting, onClose }: Props) {
  const [scope, setScope] = useState<Scope>("single");
  const [error, setError] = useState<string | null>(null);
  const cancelOne = useCancelScheduledMeeting();
  const cancelSeries = useCancelScheduledSeries();
  const isRecurring = !!meeting?.recurrence || !!meeting?.recurrenceParentId;
  const pending = cancelOne.isPending || cancelSeries.isPending;

  async function handleConfirm() {
    if (!meeting) return;
    setError(null);
    try {
      if (isRecurring && scope === "series") {
        await cancelSeries.mutateAsync(meeting.id);
      } else {
        await cancelOne.mutateAsync(meeting.id);
      }
      setScope("single");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to cancel");
    }
  }

  return (
    <Modal
      open={open && !!meeting}
      onClose={() => {
        if (!pending) {
          setScope("single");
          setError(null);
          onClose();
        }
      }}
      title="Cancel meeting?"
      subtitle={meeting?.title}
      width={460}
      footer={
        <>
          <button
            className="h-[38px] px-4 rounded-[10px] text-[14px] font-medium text-foreground hover:bg-hover transition-colors disabled:opacity-50"
            onClick={() => {
              if (!pending) {
                setScope("single");
                setError(null);
                onClose();
              }
            }}
            disabled={pending}
          >
            Keep meeting
          </button>
          <button
            className="h-[38px] px-4 rounded-[10px] bg-[#dc2626] text-white text-[14px] font-medium border border-[#dc2626] hover:bg-[#dc2626]/85 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            onClick={handleConfirm}
            disabled={pending}
          >
            {pending ? "Cancelling..." : "Cancel meeting"}
          </button>
        </>
      }
    >
      {error && (
        <div className="mb-3 px-3 py-2 rounded-[10px] bg-[#dc2626]/10 border border-[#dc2626]/20 text-[12.5px] text-[#fca5a5]">
          {error}
        </div>
      )}
      <p className="text-[13.5px] text-secondary leading-relaxed">
        Invited participants will see this meeting as cancelled in their schedule. This cannot be undone.
      </p>
      {isRecurring && (
        <div className="mt-4 flex flex-col gap-2">
          <label className="flex items-start gap-2.5 p-3 rounded-[10px] border border-border cursor-pointer hover:bg-surface-hover transition-colors">
            <input
              type="radio"
              checked={scope === "single"}
              onChange={() => setScope("single")}
              className="mt-[3px]"
            />
            <div>
              <div className="text-[13px] font-medium text-foreground">This occurrence only</div>
              <div className="text-[12px] text-tertiary mt-[2px]">
                Future occurrences in the series stay scheduled.
              </div>
            </div>
          </label>
          <label className="flex items-start gap-2.5 p-3 rounded-[10px] border border-border cursor-pointer hover:bg-surface-hover transition-colors">
            <input
              type="radio"
              checked={scope === "series"}
              onChange={() => setScope("series")}
              className="mt-[3px]"
            />
            <div>
              <div className="text-[13px] font-medium text-foreground">This and all future occurrences</div>
              <div className="text-[12px] text-tertiary mt-[2px]">
                Cancels every remaining scheduled meeting in this series.
              </div>
            </div>
          </label>
        </div>
      )}
    </Modal>
  );
}
