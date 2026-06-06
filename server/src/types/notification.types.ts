export const NOTIFICATION_TYPES = [
  "transcript-ready",
  "transcript-failed",
  "notes-ready",
  "notes-failed",
  "meeting-invited",
  "meeting-updated",
  "meeting-cancelled",
  "meeting-series-cancelled",
  "meeting-started",
  "join-request-missed",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface NotificationPayload {
  id: string;
  type: NotificationType;
  title: string;
  body?: string;
  meetingId?: string;
  roomId?: string;
  requesterName?: string;
  readAt: string | null;
  createdAt: string;
}
