import { Meeting } from "../models/Meeting";
import type { IMeeting } from "../models/Meeting";

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
