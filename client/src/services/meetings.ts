import { getStoredToken } from "./auth";

const API_BASE = import.meta.env.VITE_API_URL || "";

export interface MeetingSummary {
  id: string;
  title?: string;
  status: string;
  participantCount: number;
  durationMs?: number;
  startedAt?: string;
  endedAt?: string;
  transcriptStatus: string | null;
  notesStatus: string | null;
  recordingStatus: string | null;
}

function authHeaders(): HeadersInit {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface MeetingsPageParams {
  page?: number;
  limit?: number;
  q?: string;
  status?: string;
  transcriptStatus?: string;
}

export interface MeetingsPageResponse {
  meetings: MeetingSummary[];
  total: number;
  page: number;
  limit: number;
}

export async function fetchMeetings(limit = 20): Promise<MeetingSummary[]> {
  const res = await fetch(
    `${API_BASE}/api/meetings?limit=${limit}`,
    { headers: authHeaders() }
  );
  if (!res.ok) throw new Error("Failed to fetch meetings");
  const body = await res.json();
  return body.meetings;
}

export async function fetchMeetingsPage(
  params: MeetingsPageParams = {}
): Promise<MeetingsPageResponse> {
  const sp = new URLSearchParams();
  if (params.page) sp.set("page", String(params.page));
  if (params.limit) sp.set("limit", String(params.limit));
  if (params.q) sp.set("q", params.q);
  if (params.status) sp.set("status", params.status);
  if (params.transcriptStatus) sp.set("transcriptStatus", params.transcriptStatus);

  const res = await fetch(
    `${API_BASE}/api/meetings?${sp.toString()}`,
    { headers: authHeaders() }
  );
  if (!res.ok) throw new Error("Failed to fetch meetings");
  return res.json();
}

export async function fetchMeetingNotes(meetingId: string): Promise<string> {
  const res = await fetch(
    `${API_BASE}/api/meetings/${encodeURIComponent(meetingId)}/notes`,
    { headers: authHeaders() }
  );
  if (!res.ok) throw new Error("Failed to fetch meeting notes");
  const body = await res.json();
  return body.meetingNotes ?? "";
}

export async function fetchTranscriptText(meetingId: string): Promise<string> {
  const res = await fetch(
    `${API_BASE}/api/meetings/${encodeURIComponent(meetingId)}/transcript`,
    { headers: authHeaders() }
  );
  if (!res.ok) throw new Error("Failed to fetch transcript");
  const body = await res.json();
  return body.fullText ?? "";
}
