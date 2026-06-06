import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchMeetings,
  fetchMeetingsPage,
  fetchMeetingStats,
  fetchPinnedMeetings,
  togglePinMeeting,
  type MeetingSummary,
  type MeetingsPageParams,
  type MeetingsPageResponse,
  type PinnedMeetingSummary,
} from "../services/meetings";
import { queryClient } from "./queryClient";

export const meetingKeys = {
  all: ["meetings"] as const,
  recent: (limit: number) => ["meetings", "recent", limit] as const,
  page: (params: MeetingsPageParams) => ["meetings", "page", params] as const,
  stats: () => ["meetings", "stats"] as const,
  pinned: (limit: number) => ["meetings", "pinned", limit] as const,
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

export function useMeetingStats() {
  return useQuery({
    queryKey: meetingKeys.stats(),
    queryFn: fetchMeetingStats,
  });
}

export function usePinnedMeetings(limit = 10) {
  return useQuery({
    queryKey: meetingKeys.pinned(limit),
    queryFn: () => fetchPinnedMeetings(limit),
  });
}

export function useTogglePinMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ meetingId, pinned }: { meetingId: string; pinned: boolean }) =>
      togglePinMeeting(meetingId, pinned),
    onMutate: async ({ meetingId, pinned }) => {
      await qc.cancelQueries({ queryKey: ["meetings"] });
      await qc.cancelQueries({ queryKey: ["schedules"] });
      const updateList = (list: MeetingSummary[] | undefined) =>
        list?.map((m) => (m.id === meetingId ? { ...m, pinned } : m));
      qc.setQueriesData<MeetingSummary[]>({ queryKey: ["meetings", "recent"] }, updateList);
      qc.setQueriesData<MeetingsPageResponse>(
        { queryKey: ["meetings", "page"] },
        (old) => (old ? { ...old, meetings: updateList(old.meetings) ?? old.meetings } : old)
      );
      qc.setQueriesData<{
        items: Array<{ id: string; pinned: boolean }>;
        total: number;
      }>({ queryKey: ["schedules", "list"] }, (old) =>
        old
          ? {
              ...old,
              items: old.items.map((s) =>
                s.id === meetingId ? { ...s, pinned } : s
              ),
            }
          : old
      );
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["meetings", "pinned"] });
      qc.invalidateQueries({ queryKey: ["meetings", "recent"] });
      qc.invalidateQueries({ queryKey: ["meetings", "page"] });
      qc.invalidateQueries({ queryKey: ["schedules"] });
    },
  });
}

export type { PinnedMeetingSummary };

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

export function updateMeetingNotesStatus(
  meetingId: string,
  status: string
) {
  queryClient.setQueriesData<MeetingSummary[]>(
    { queryKey: ["meetings", "recent"] },
    (old) =>
      old?.map((m) =>
        m.id === meetingId ? { ...m, notesStatus: status } : m
      )
  );
  queryClient.setQueriesData<MeetingsPageResponse>(
    { queryKey: ["meetings", "page"] },
    (old) =>
      old
        ? {
            ...old,
            meetings: old.meetings.map((m) =>
              m.id === meetingId ? { ...m, notesStatus: status } : m
            ),
          }
        : old
  );
}

export function invalidateMeetings() {
  queryClient.invalidateQueries({ queryKey: meetingKeys.all });
}
