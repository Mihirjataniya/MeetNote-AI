export const TRANSCRIPT_STATUSES = [
  "pending",
  "processing",
  "completed",
  "failed",
] as const;

export type TranscriptStatus = (typeof TRANSCRIPT_STATUSES)[number];

export interface TranscriptSegmentDTO {
  speakerUserId?: string;
  speakerName: string;
  text: string;
  startMs: number;
  endMs: number;
  confidence?: number;
}

export interface TranscriptInfo {
  id: string;
  meetingId: string;
  recordingId: string;
  status: TranscriptStatus;
  language?: string;
  segments: TranscriptSegmentDTO[];
  fullText?: string;
  createdAt: string;
  updatedAt: string;
}
