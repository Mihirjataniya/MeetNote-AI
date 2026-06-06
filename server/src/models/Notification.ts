import { Schema, model } from "mongoose";
import type { Document, Types } from "mongoose";
import { NOTIFICATION_TYPES, type NotificationType } from "../types/notification.types";

export interface INotification extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  body?: string;
  meetingId?: Types.ObjectId;
  roomId?: string;
  requesterName?: string;
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true },
    body: { type: String },
    meetingId: { type: Schema.Types.ObjectId, ref: "Meeting" },
    roomId: { type: String },
    requesterName: { type: String },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Index for the two hot queries: list user's notifications by recency,
// and count unread for the bell badge.
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, readAt: 1 });

export const Notification = model<INotification>("Notification", notificationSchema);
