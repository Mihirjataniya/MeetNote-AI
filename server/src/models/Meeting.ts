import { Schema, model } from "mongoose";
import type { Document, Types } from "mongoose";
import type { MeetingStatus, ParticipantRole, RecurrenceFrequency } from "../types/index";
import { MEETING_STATUSES, PARTICIPANT_ROLES, RECURRENCE_FREQUENCIES } from "../types/index";

export interface IMeetingParticipant {
  userId: Types.ObjectId;
  displayName: string;
  joinedAt: Date;
  leftAt?: Date;
  role: ParticipantRole;
}

export interface IMeetingRecurrence {
  frequency: RecurrenceFrequency;
  interval: number;
  until: Date;
}

export interface IMeeting extends Document {
  _id: Types.ObjectId;
  roomId: string;
  title?: string;
  agenda?: string;
  status: MeetingStatus;
  createdBy: Types.ObjectId;
  participants: IMeetingParticipant[];
  invitedUserIds: Types.ObjectId[];
  scheduledStartTime?: Date;
  scheduledDurationMin?: number;
  recurrence?: IMeetingRecurrence;
  recurrenceParentId?: Types.ObjectId;
  startedAt?: Date;
  endedAt?: Date;
  durationMs?: number;
  pinnedBy: Types.ObjectId[];
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

const meetingRecurrenceSchema = new Schema<IMeetingRecurrence>(
  {
    frequency: {
      type: String,
      enum: RECURRENCE_FREQUENCIES,
      required: true,
    },
    interval: { type: Number, required: true, min: 1, default: 1 },
    until: { type: Date, required: true },
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
    invitedUserIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    scheduledStartTime: { type: Date },
    scheduledDurationMin: { type: Number, min: 5, max: 720 },
    recurrence: { type: meetingRecurrenceSchema, default: undefined },
    recurrenceParentId: { type: Schema.Types.ObjectId, ref: "Meeting" },
    startedAt: { type: Date },
    endedAt: { type: Date },
    durationMs: { type: Number },
    pinnedBy: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
  },
  { timestamps: true }
);

meetingSchema.index({ createdBy: 1, createdAt: -1 });
meetingSchema.index({ roomId: 1 });
meetingSchema.index({ status: 1, startedAt: -1 });
meetingSchema.index({ "participants.userId": 1 });
meetingSchema.index({ invitedUserIds: 1, scheduledStartTime: 1 });
meetingSchema.index({ createdBy: 1, scheduledStartTime: 1 });
meetingSchema.index({ recurrenceParentId: 1 });
meetingSchema.index({ pinnedBy: 1, updatedAt: -1 });

export const Meeting = model<IMeeting>("Meeting", meetingSchema);
