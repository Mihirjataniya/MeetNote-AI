export const RECORDING_STATUSES = [
  "recording",
  "processing",
  "ready",
  "failed",
] as const;

export type RecordingStatus = (typeof RECORDING_STATUSES)[number];

export interface CloudinaryFile {
  fileName: string;
  url: string;
  publicId: string;
}

export interface RecordingInfo {
  id: string;
  meetingId: string;
  recordedBy: string;
  status: RecordingStatus;
  durationMs?: number;
  cloudinaryUrls?: CloudinaryFile[];
  startedAt: string;
  stoppedAt?: string;
  createdAt: string;
  updatedAt: string;
}
