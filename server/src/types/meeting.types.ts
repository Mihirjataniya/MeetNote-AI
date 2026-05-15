export const MEETING_STATUSES = [
  "scheduled",
  "active",
  "ended",
  "cancelled",
] as const;

export type MeetingStatus = (typeof MEETING_STATUSES)[number];

export const PARTICIPANT_ROLES = ["host", "participant"] as const;

export type ParticipantRole = (typeof PARTICIPANT_ROLES)[number];

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
  startedAt?: string;
  endedAt?: string;
  durationMs?: number;
  createdAt: string;
  updatedAt: string;
}
