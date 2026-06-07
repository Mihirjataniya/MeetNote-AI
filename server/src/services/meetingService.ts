import { Types } from "mongoose";
import { Meeting } from "../models/Meeting";
import type { IMeeting } from "../models/Meeting";

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export type MeetingSortKey = "newest" | "oldest" | "longest" | "shortest";

export interface PaginationOptions {
  page?: number;
  limit?: number;
  q?: string;
  status?: string;
  from?: Date;
  to?: Date;
  pinnedOnly?: boolean;
  hostedByMe?: boolean;
  sort?: MeetingSortKey;
}

class MeetingService {
  async createMeeting(
    roomId: string,
    userId: string,
    displayName: string,
    options?: { title?: string; agenda?: string }
  ): Promise<string | null> {
    try {
      const meeting = await Meeting.create({
        roomId,
        title: options?.title,
        agenda: options?.agenda,
        status: "active",
        createdBy: userId,
        startedAt: new Date(),
        participants: [
          {
            userId,
            displayName,
            joinedAt: new Date(),
            role: "host",
          },
        ],
      });
      return meeting._id.toString();
    } catch (err) {
      console.error("Failed to create meeting:", err);
      return null;
    }
  }

  async addParticipant(
    meetingId: string,
    userId: string,
    displayName: string
  ): Promise<void> {
    try {
      await Meeting.updateOne(
        { _id: meetingId },
        {
          $push: {
            participants: {
              userId,
              displayName,
              joinedAt: new Date(),
              role: "participant",
            },
          },
        }
      );
    } catch (err) {
      console.error("Failed to add participant to meeting:", err);
    }
  }

  async removeParticipant(
    meetingId: string,
    userId: string
  ): Promise<void> {
    try {
      await Meeting.updateOne(
        {
          _id: meetingId,
          "participants.userId": userId,
          "participants.leftAt": null,
        },
        { $set: { "participants.$.leftAt": new Date() } }
      );
    } catch (err) {
      console.error("Failed to remove participant from meeting:", err);
    }
  }

  async getUserMeetings(
    userId: string,
    limit = 20
  ): Promise<IMeeting[]> {
    return Meeting.find({
      "participants.userId": userId,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean<IMeeting[]>();
  }

  async getUserMeetingsPaginated(
    userId: string,
    opts: PaginationOptions = {}
  ): Promise<{ meetings: IMeeting[]; total: number }> {
    const page = Math.max(opts.page ?? 1, 1);
    const limit = Math.min(Math.max(opts.limit ?? 20, 1), 100);

    const userObjectId = Types.ObjectId.isValid(userId)
      ? new Types.ObjectId(userId)
      : userId;

    const filter: Record<string, unknown> = {
      "participants.userId": userObjectId,
    };
    if (opts.q) {
      filter.title = { $regex: escapeRegex(opts.q), $options: "i" };
    }
    if (opts.status) {
      filter.status = opts.status;
    }
    if (opts.pinnedOnly) {
      filter.pinnedBy = userObjectId;
    }
    if (opts.hostedByMe) {
      filter.createdBy = userObjectId;
    }
    if (opts.from || opts.to) {
      const range: Record<string, Date> = {};
      if (opts.from) range.$gte = opts.from;
      if (opts.to) range.$lte = opts.to;
      filter.startedAt = range;
    }

    // Sort: newest/oldest by startedAt (fall back to createdAt for meetings
    // that never started); longest/shortest by recorded durationMs.
    const sortKey: MeetingSortKey = opts.sort ?? "newest";
    const sort: Record<string, 1 | -1> =
      sortKey === "oldest"
        ? { startedAt: 1, createdAt: 1 }
        : sortKey === "longest"
          ? { durationMs: -1, startedAt: -1 }
          : sortKey === "shortest"
            ? { durationMs: 1, startedAt: -1 }
            : { startedAt: -1, createdAt: -1 };

    const [meetings, total] = await Promise.all([
      Meeting.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean<IMeeting[]>(),
      Meeting.countDocuments(filter),
    ]);

    return { meetings, total };
  }

  async getMeetingById(meetingId: string): Promise<IMeeting | null> {
    return Meeting.findById(meetingId).lean<IMeeting>();
  }

  async endMeeting(meetingId: string): Promise<void> {
    try {
      const meeting = await Meeting.findById(meetingId) as IMeeting | null;
      if (!meeting) return;

      const now = new Date();
      const durationMs = meeting.startedAt
        ? now.getTime() - meeting.startedAt.getTime()
        : 0;

      await Meeting.updateOne(
        { _id: meetingId },
        {
          $set: {
            status: "ended",
            endedAt: now,
            durationMs,
            "participants.$[open].leftAt": now,
          },
        },
        {
          arrayFilters: [{ "open.leftAt": null }],
        }
      );
    } catch (err) {
      console.error("Failed to end meeting:", err);
    }
  }
}

export const meetingService = new MeetingService();
