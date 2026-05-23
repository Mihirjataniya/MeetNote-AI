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
  recordingStatus: string | null;
}

function authHeaders(): HeadersInit {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
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
