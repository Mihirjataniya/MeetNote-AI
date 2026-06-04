import { useMutation } from "@tanstack/react-query";
import {
  createScheduledMeeting,
  updateScheduledMeeting,
  cancelScheduledMeeting,
  cancelScheduledSeries,
  type ScheduleMeetingPayload,
  type UpdateSchedulePayload,
} from "../services/schedules";
import { queryClient } from "./queryClient";
import { scheduleKeys } from "./useSchedulesQuery";

function invalidate() {
  queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
}

export function useCreateScheduledMeeting() {
  return useMutation({
    mutationFn: (payload: ScheduleMeetingPayload) => createScheduledMeeting(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateScheduledMeeting() {
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSchedulePayload }) =>
      updateScheduledMeeting(id, payload),
    onSuccess: invalidate,
  });
}

export function useCancelScheduledMeeting() {
  return useMutation({
    mutationFn: (id: string) => cancelScheduledMeeting(id),
    onSuccess: invalidate,
  });
}

export function useCancelScheduledSeries() {
  return useMutation({
    mutationFn: (id: string) => cancelScheduledSeries(id),
    onSuccess: invalidate,
  });
}
