import { Schema, model } from "mongoose";
import type { Document, Types } from "mongoose";

export interface IPushSubscription extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const pushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    endpoint: { type: String, required: true, unique: true },
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
    userAgent: { type: String },
  },
  { timestamps: true }
);

pushSubscriptionSchema.index({ userId: 1 });

export const PushSubscription = model<IPushSubscription>(
  "PushSubscription",
  pushSubscriptionSchema
);
