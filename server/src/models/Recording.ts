import { Schema, model } from "mongoose";
import type { Document, Types } from "mongoose";
import type { RecordingStatus, CloudinaryFile } from "../types/index";
import { RECORDING_STATUSES } from "../types/index";

export interface IRecording extends Document {
  _id: Types.ObjectId;
  meetingId: Types.ObjectId;
  recordedBy: Types.ObjectId;
  status: RecordingStatus;
  durationMs?: number;
  cloudinaryUrls?: CloudinaryFile[];
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
    cloudinaryUrls: [
      {
        fileName: { type: String, required: true },
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
    startedAt: { type: Date, required: true },
    stoppedAt: { type: Date },
  },
  { timestamps: true }
);

recordingSchema.index({ meetingId: 1 });

export const Recording = model<IRecording>("Recording", recordingSchema);
