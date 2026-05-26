import { useQuery } from "@tanstack/react-query";
import {
  fetchMeetings,
  fetchMeetingsPage,
  type MeetingSummary,
  type MeetingsPageParams,
  type MeetingsPageResponse,
} from "../services/meetings";
import { queryClient } from "./queryClient";

export const meetingKeys = {
  all: ["meetings"] as const,
  recent: (limit: number) => ["meetings", "recent", limit] as const,
  page: (params: MeetingsPageParams) => ["meetings", "page", params] as const,
};

export function useRecentMeetings(limit = 5) {
  return useQuery({
    queryKey: meetingKeys.recent(limit),
    queryFn: () => fetchMeetings(limit),
  });
}

export function useMeetingsPage(params: MeetingsPageParams) {
  return useQuery({
    queryKey: meetingKeys.page(params),
    queryFn: () => fetchMeetingsPage(params),
  });
}

export function updateMeetingTranscriptStatus(
  meetingId: string,
  status: string
) {
  queryClient.setQueriesData<MeetingSummary[]>(
    { queryKey: ["meetings", "recent"] },
    (old) =>
      old?.map((m) =>
        m.id === meetingId ? { ...m, transcriptStatus: status } : m
      )
  );
  queryClient.setQueriesData<MeetingsPageResponse>(
    { queryKey: ["meetings", "page"] },
    (old) =>
      old
        ? {
            ...old,
            meetings: old.meetings.map((m) =>
              m.id === meetingId ? { ...m, transcriptStatus: status } : m
            ),
          }
        : old
  );
}

export function invalidateMeetings() {
  queryClient.invalidateQueries({ queryKey: meetingKeys.all });
}
