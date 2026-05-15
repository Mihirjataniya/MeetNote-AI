import { Schema, model } from "mongoose";
import type { Document, Types } from "mongoose";
import type { TranscriptStatus } from "../types/index";
import { TRANSCRIPT_STATUSES } from "../types/index";

export interface ITranscriptSegment {
  speakerUserId?: Types.ObjectId;
  speakerName: string;
  text: string;
  startMs: number;
  endMs: number;
  confidence?: number;
}

export interface ITranscript extends Document {
  _id: Types.ObjectId;
  meetingId: Types.ObjectId;
  recordingId: Types.ObjectId;
  status: TranscriptStatus;
  language?: string;
  segments: ITranscriptSegment[];
  fullText?: string;
  createdAt: Date;
  updatedAt: Date;
}

const transcriptSegmentSchema = new Schema<ITranscriptSegment>(
  {
    speakerUserId: { type: Schema.Types.ObjectId, ref: "User" },
    speakerName: { type: String, required: true, trim: true },
    text: { type: String, required: true },
    startMs: { type: Number, required: true },
    endMs: { type: Number, required: true },
    confidence: { type: Number, min: 0, max: 1 },
  },
  { _id: false }
);

const transcriptSchema = new Schema<ITranscript>(
  {
    meetingId: {
      type: Schema.Types.ObjectId,
      ref: "Meeting",
      required: true,
    },
    recordingId: {
      type: Schema.Types.ObjectId,
      ref: "Recording",
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: TRANSCRIPT_STATUSES,
      default: "pending",
      required: true,
    },
    language: { type: String },
    segments: [transcriptSegmentSchema],
    fullText: { type: String },
  },
  { timestamps: true }
);

transcriptSchema.index({ meetingId: 1 });
transcriptSchema.index({ status: 1 });

export const Transcript = model<ITranscript>("Transcript", transcriptSchema);
