export const MEETING_STATUSES = [
  "scheduled",
  "active",
  "ended",
  "cancelled",
  "missed",
] as const;

export type MeetingStatus = (typeof MEETING_STATUSES)[number];

export const PARTICIPANT_ROLES = ["host", "participant"] as const;

export type ParticipantRole = (typeof PARTICIPANT_ROLES)[number];

export const RECURRENCE_FREQUENCIES = ["daily", "weekly", "monthly"] as const;

export type RecurrenceFrequency = (typeof RECURRENCE_FREQUENCIES)[number];

export type EffectiveMeetingStatus = MeetingStatus | "ready";

export interface RecurrenceDTO {
  frequency: RecurrenceFrequency;
  interval?: number;
  until: string;
}

export interface ScheduleMeetingDTO {
  title: string;
  agenda?: string;
  scheduledStartTime: string;
  scheduledDurationMin: number;
  invitedUserIds: string[];
  recurrence?: RecurrenceDTO;
}

export interface UpdateScheduleDTO {
  title?: string;
  agenda?: string;
  scheduledStartTime?: string;
  scheduledDurationMin?: number;
  invitedUserIds?: string[];
}

export interface ScheduledMeetingSummary {
  id: string;
  roomId: string;
  title: string;
  agenda?: string;
  scheduledStartTime: string;
  scheduledDurationMin: number;
  status: MeetingStatus;
  effectiveStatus: EffectiveMeetingStatus;
  isHost: boolean;
  hostId: string;
  hostName: string;
  invitedUsers: Array<{ id: string; displayName: string; email: string }>;
  recurrence?: RecurrenceDTO;
  recurrenceParentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParticipantInfoDTO {
  userId: string;
  displayName: string;
  joinedAt: string;
  leftAt?: string;
  role: ParticipantRole;
}

export interface MeetingInfo {
  id: string;
  roomId: string;
  title?: string;
  agenda?: string;
  status: MeetingStatus;
  createdBy: string;
  participants: ParticipantInfoDTO[];
  scheduledStartTime?: string;
  scheduledDurationMin?: number;
  recurrence?: RecurrenceDTO;
  recurrenceParentId?: string;
  startedAt?: string;
  endedAt?: string;
  durationMs?: number;
  createdAt: string;
  updatedAt: string;
}
