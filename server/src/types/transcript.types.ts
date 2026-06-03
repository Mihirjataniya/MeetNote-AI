export const TRANSCRIPT_STATUSES = [
  "pending",
  "processing",
  "completed",
  "failed",
] as const;

export type TranscriptStatus = (typeof TRANSCRIPT_STATUSES)[number];

export interface TranscriptSegmentDTO {
  text: string;
  startMs: number;
  endMs: number;
  confidence?: number;
}

export const NOTES_STATUSES = [
  "pending",
  "generating",
  "completed",
  "failed",
] as const;

export type NotesStatus = (typeof NOTES_STATUSES)[number];

export interface TranscriptInfo {
  id: string;
  meetingId: string;
  recordingId: string;
  status: TranscriptStatus;
  language?: string;
  segments: TranscriptSegmentDTO[];
  fullText?: string;
  meetingNotes?: string;
  notesStatus?: NotesStatus;
  createdAt: string;
  updatedAt: string;
}
