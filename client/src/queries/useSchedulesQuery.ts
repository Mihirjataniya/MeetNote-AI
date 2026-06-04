import { useQuery } from "@tanstack/react-query";
import { fetchScheduledMeetings, type ListSchedulesParams } from "../services/schedules";

export const scheduleKeys = {
  all: ["schedules"] as const,
  list: (params: ListSchedulesParams) => ["schedules", "list", params] as const,
};

export function useScheduledMeetings(params: ListSchedulesParams = {}) {
  return useQuery({
    queryKey: scheduleKeys.list(params),
    queryFn: () => fetchScheduledMeetings(params),
  });
}
