import { getStoredToken } from "./auth";

const API_BASE = import.meta.env.VITE_API_URL || "";

export type NotificationType =
  | "transcript-ready"
  | "transcript-failed"
  | "notes-ready"
  | "notes-failed"
  | "meeting-invited"
  | "meeting-updated"
  | "meeting-cancelled"
  | "meeting-series-cancelled"
  | "meeting-started"
  | "join-request-missed";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body?: string;
  meetingId?: string;
  roomId?: string;
  requesterName?: string;
  actorName?: string;
  scheduledStartTime?: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsPageResponse {
  notifications: NotificationItem[];
  total: number;
  unread: number;
  page: number;
  limit: number;
}

function authHeaders(): HeadersInit {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchNotifications(
  page = 1,
  limit = 20
): Promise<NotificationsPageResponse> {
  const res = await fetch(
    `${API_BASE}/api/notifications?page=${page}&limit=${limit}`,
    { headers: authHeaders() }
  );
  if (!res.ok) throw new Error("Failed to fetch notifications");
  return res.json();
}

export async function fetchUnreadCount(): Promise<number> {
  const res = await fetch(`${API_BASE}/api/notifications/unread-count`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch unread count");
  const body = await res.json();
  return body.unread ?? 0;
}

export async function markNotificationRead(id: string): Promise<void> {
  const res = await fetch(
    `${API_BASE}/api/notifications/${encodeURIComponent(id)}/read`,
    { method: "PATCH", headers: authHeaders() }
  );
  if (!res.ok) throw new Error("Failed to mark read");
}

export async function markAllNotificationsRead(): Promise<number> {
  const res = await fetch(`${API_BASE}/api/notifications/read-all`, {
    method: "PATCH",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to mark all read");
  const body = await res.json();
  return body.markedCount ?? 0;
}

export async function deleteNotification(id: string): Promise<void> {
  const res = await fetch(
    `${API_BASE}/api/notifications/${encodeURIComponent(id)}`,
    { method: "DELETE", headers: authHeaders() }
  );
  if (!res.ok) throw new Error("Failed to delete notification");
}
