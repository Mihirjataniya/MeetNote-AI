import { Types } from "mongoose";
import { User } from "../models/User";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

class UserService {
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
