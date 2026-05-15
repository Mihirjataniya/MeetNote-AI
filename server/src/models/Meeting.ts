import { Schema, model } from "mongoose";
import type { Document, Types } from "mongoose";
import type { MeetingStatus, ParticipantRole } from "../types/index";
import { MEETING_STATUSES, PARTICIPANT_ROLES } from "../types/index";

export interface IMeetingParticipant {
  userId: Types.ObjectId;
  displayName: string;
  joinedAt: Date;
  leftAt?: Date;
  role: ParticipantRole;
}

export interface IMeeting extends Document {
  _id: Types.ObjectId;
  roomId: string;
  title?: string;
  agenda?: string;
  status: MeetingStatus;
  createdBy: Types.ObjectId;
  participants: IMeetingParticipant[];
  scheduledStartTime?: Date;
  startedAt?: Date;
  endedAt?: Date;
  durationMs?: number;
  createdAt: Date;
  updatedAt: Date;
}

const meetingParticipantSchema = new Schema<IMeetingParticipant>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    displayName: { type: String, required: true, trim: true },
    joinedAt: { type: Date, required: true },
    leftAt: { type: Date },
    role: {
      type: String,
      enum: PARTICIPANT_ROLES,
      default: "participant",
      required: true,
    },
  },
  { _id: false }
);

const meetingSchema = new Schema<IMeeting>(
  {
    roomId: { type: String, required: true },
    title: { type: String, trim: true },
    agenda: { type: String, trim: true },
    status: {
      type: String,
      enum: MEETING_STATUSES,
      default: "scheduled",
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participants: [meetingParticipantSchema],
    scheduledStartTime: { type: Date },
    startedAt: { type: Date },
    endedAt: { type: Date },
    durationMs: { type: Number },
  },
  { timestamps: true }
);

meetingSchema.index({ createdBy: 1, createdAt: -1 });
meetingSchema.index({ roomId: 1 });
meetingSchema.index({ status: 1, startedAt: -1 });
meetingSchema.index({ "participants.userId": 1 });

export const Meeting = model<IMeeting>("Meeting", meetingSchema);
