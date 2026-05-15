export const RECORDING_STATUSES = [
  "recording",
  "ready",
  "failed",
] as const;

export type RecordingStatus = (typeof RECORDING_STATUSES)[number];

export interface RecordingInfo {
  id: string;
  meetingId: string;
  recordedBy: string;
  status: RecordingStatus;
  durationMs?: number;
  storagePath?: string;
  startedAt: string;
  stoppedAt?: string;
  createdAt: string;
  updatedAt: string;
}
