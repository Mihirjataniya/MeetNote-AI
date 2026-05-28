import { Schema, model } from "mongoose";
import type { Document, Types } from "mongoose";

export interface IChatMessage extends Document {
  _id: Types.ObjectId;
  meetingId: Types.ObjectId;
  userId: Types.ObjectId;
  displayName: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>(
  {
    meetingId: {
      type: Schema.Types.ObjectId,
      ref: "Meeting",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    displayName: { type: String, required: true, trim: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

chatMessageSchema.index({ meetingId: 1, createdAt: 1 });

export const ChatMessage = model<IChatMessage>(
  "ChatMessage",
  chatMessageSchema
);
