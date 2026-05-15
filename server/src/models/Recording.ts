import { Schema, model } from "mongoose";
import type { Document, Types } from "mongoose";
import type { RecordingStatus } from "../types/index";
import { RECORDING_STATUSES } from "../types/index";

export interface IRecording extends Document {
  _id: Types.ObjectId;
  meetingId: Types.ObjectId;
  recordedBy: Types.ObjectId;
  status: RecordingStatus;
  durationMs?: number;
  storagePath?: string;
  startedAt: Date;
  stoppedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const recordingSchema = new Schema<IRecording>(
  {
    meetingId: {
      type: Schema.Types.ObjectId,
      ref: "Meeting",
      required: true,
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: RECORDING_STATUSES,
      default: "recording",
      required: true,
    },
    durationMs: { type: Number },
    storagePath: { type: String },
    startedAt: { type: Date, required: true },
    stoppedAt: { type: Date },
  },
  { timestamps: true }
);

recordingSchema.index({ meetingId: 1 });

export const Recording = model<IRecording>("Recording", recordingSchema);
