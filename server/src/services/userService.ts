import { Types } from "mongoose";
import bcrypt from "bcryptjs";
import { User, type IUser } from "../models/User";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export class UserServiceError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

class UserService {
  private readonly SALT_ROUNDS = 10;

  async getById(userId: string): Promise<IUser | null> {
    if (!Types.ObjectId.isValid(userId)) return null;
    return User.findById(userId);
  }

  async updateProfile(
    userId: string,
    patch: { displayName?: string; email?: string }
  ): Promise<IUser> {
    const updates: Partial<IUser> = {};

    if (patch.displayName !== undefined) {
      const name = patch.displayName.trim();
      if (!name) {
        throw new UserServiceError(400, "Display name cannot be empty");
      }
      if (name.length > 50) {
        throw new UserServiceError(400, "Display name must be 50 characters or fewer");
      }
      updates.displayName = name;
    }

    if (patch.email !== undefined) {
      const email = patch.email.trim().toLowerCase();
      if (!email.includes("@")) {
        throw new UserServiceError(400, "Valid email is required");
      }
      const collision = await User.findOne({
        email,
        _id: { $ne: new Types.ObjectId(userId) },
      })
        .select("_id")
        .lean();
      if (collision) {
        throw new UserServiceError(409, "Email already in use", "EMAIL_TAKEN");
      }
      updates.email = email;
    }

    if (Object.keys(updates).length === 0) {
      throw new UserServiceError(400, "Nothing to update");
    }

    const user = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true });
    if (!user) throw new UserServiceError(404, "User not found");
    return user;
  }

  async updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    if (typeof newPassword !== "string" || newPassword.length < 6) {
      throw new UserServiceError(400, "New password must be at least 6 characters");
    }
    const user = await User.findById(userId);
    if (!user) throw new UserServiceError(404, "User not found");

    const ok = await bcrypt.compare(currentPassword ?? "", user.password);
    if (!ok) {
      throw new UserServiceError(401, "Current password is incorrect", "BAD_CURRENT_PASSWORD");
    }

    user.password = await bcrypt.hash(newPassword, this.SALT_ROUNDS);
    await user.save();
  }
  async search(
    query: string,
    excludeUserId: string,
    limit = 10
  ): Promise<Array<{ id: string; displayName: string; email: string }>> {
    const q = query.trim();
    if (q.length < 1) return [];
    const safe = escapeRegex(q);
    const regex = new RegExp(safe, "i");
    const users = await User.find({
      _id: { $ne: new Types.ObjectId(excludeUserId) },
      $or: [{ displayName: regex }, { email: regex }],
    })
      .select("displayName email")
      .limit(Math.min(20, Math.max(1, limit)))
      .lean();

    return users.map((u) => ({
      id: u._id.toString(),
      displayName: u.displayName,
      email: u.email,
    }));
  }

  async resolveMany(
    ids: string[]
  ): Promise<Array<{ id: string; displayName: string; email: string }>> {
    if (ids.length === 0) return [];
    const objIds = ids.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
    const users = await User.find({ _id: { $in: objIds } }).select("displayName email").lean();
    return users.map((u) => ({
      id: u._id.toString(),
      displayName: u.displayName,
      email: u.email,
    }));
  }
}

export const userService = new UserService();
