import { Schema, model } from "mongoose";
import type { Document, Types } from "mongoose";

export type AuthProvider = "password" | "google";

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  // Optional: Google-only accounts never set a password.
  password?: string;
  googleId?: string;
  authProvider: AuthProvider;
  displayName: string;
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
  },
  // sparse: many docs may lack googleId, but those that have it stay unique.
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  authProvider: {
    type: String,
    enum: ["password", "google"],
    default: "password",
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const User = model<IUser>("User", userSchema);
