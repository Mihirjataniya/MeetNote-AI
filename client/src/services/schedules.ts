import { getStoredToken } from "./auth";

const API_BASE = import.meta.env.VITE_API_URL || "";

function authHeaders(extra: HeadersInit = {}): HeadersInit {
  const token = getStoredToken();
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export type RecurrenceFrequency = "daily" | "weekly" | "monthly";

export type EffectiveStatus = "scheduled" | "ready" | "active" | "ended" | "cancelled" | "missed";

export interface RecurrenceDTO {
  frequency: RecurrenceFrequency;
  interval: number;
  until: string;
}

export interface ScheduledMeetingSummary {
  id: string;
  roomId: string;
  title: string;
  agenda?: string;
  scheduledStartTime: string;
  scheduledDurationMin: number;
  status: string;
  effectiveStatus: EffectiveStatus;
  isHost: boolean;
  hostId: string;
  hostName: string;
  invitedUsers: Array<{ id: string; displayName: string; email: string }>;
  recurrence?: RecurrenceDTO;
  recurrenceParentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleMeetingPayload {
  title: string;
  agenda?: string;
  scheduledStartTime: string;
  scheduledDurationMin: number;
  invitedUserIds: string[];
  recurrence?: {
    frequency: RecurrenceFrequency;
    interval?: number;
    until: string;
  };
}

export interface UpdateSchedulePayload {
  title?: string;
  agenda?: string;
  scheduledStartTime?: string;
  scheduledDurationMin?: number;
  invitedUserIds?: string[];
}

export interface ListSchedulesParams {
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface ListSchedulesResponse {
  items: ScheduledMeetingSummary[];
  total: number;
  page: number;
  limit: number;
}

export async function fetchScheduledMeetings(
  params: ListSchedulesParams = {}
): Promise<ListSchedulesResponse> {
  const sp = new URLSearchParams();
  if (params.from) sp.set("from", params.from);
  if (params.to) sp.set("to", params.to);
  if (params.page) sp.set("page", String(params.page));
  if (params.limit) sp.set("limit", String(params.limit));
  const qs = sp.toString();
  const res = await fetch(`${API_BASE}/api/schedules${qs ? `?${qs}` : ""}`, {
    headers: authHeaders(),
  });
  return jsonOrThrow<ListSchedulesResponse>(res);
}

export async function fetchScheduledMeeting(id: string): Promise<ScheduledMeetingSummary> {
  const res = await fetch(`${API_BASE}/api/schedules/${encodeURIComponent(id)}`, {
    headers: authHeaders(),
  });
  return jsonOrThrow<ScheduledMeetingSummary>(res);
}

export async function createScheduledMeeting(
  payload: ScheduleMeetingPayload
): Promise<{ schedules: ScheduledMeetingSummary[]; clipped: boolean }> {
  const res = await fetch(`${API_BASE}/api/schedules`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  return jsonOrThrow(res);
}

export async function updateScheduledMeeting(
  id: string,
  payload: UpdateSchedulePayload
): Promise<ScheduledMeetingSummary> {
  const res = await fetch(`${API_BASE}/api/schedules/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  return jsonOrThrow<ScheduledMeetingSummary>(res);
}

export async function cancelScheduledMeeting(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/schedules/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  await jsonOrThrow(res);
}

export async function cancelScheduledSeries(id: string): Promise<{ cancelledCount: number }> {
  const res = await fetch(`${API_BASE}/api/schedules/${encodeURIComponent(id)}/series`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return jsonOrThrow(res);
}

export async function downloadScheduleIcs(id: string, filename: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/schedules/${encodeURIComponent(id)}/ics`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to download invite");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename.replace(/[^a-z0-9-_]+/gi, "_")}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
