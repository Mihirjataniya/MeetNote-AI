import { Types } from "mongoose";
import { getIO } from "../socket/index";
import { Meeting } from "../models/Meeting";
import { User } from "../models/User";
import { Notification, type INotification } from "../models/Notification";
import { sendPushToUser } from "./pushService";
import type { MeetingStateChangeKind, NotificationType, NotificationPayload } from "../types/index";

function toPayload(n: INotification): NotificationPayload {
  return {
    id: n._id.toString(),
    type: n.type,
    title: n.title,
    body: n.body,
    meetingId: n.meetingId?.toString(),
    roomId: n.roomId,
    requesterName: n.requesterName,
    actorName: n.actorName,
    scheduledStartTime: n.scheduledStartTime ? n.scheduledStartTime.toISOString() : null,
    readAt: n.readAt ? n.readAt.toISOString() : null,
    createdAt: n.createdAt.toISOString(),
  };
}

interface CreateOpts {
  userId: string | Types.ObjectId;
  type: NotificationType;
  title: string;
  body?: string;
  meetingId?: string | Types.ObjectId;
  roomId?: string;
  requesterName?: string;
  actorName?: string;
  scheduledStartTime?: Date | null;
}

export async function createNotification(opts: CreateOpts): Promise<NotificationPayload | null> {
  try {
    const doc = await Notification.create({
      userId: opts.userId,
      type: opts.type,
      title: opts.title,
      body: opts.body,
      meetingId: opts.meetingId,
      roomId: opts.roomId,
      requesterName: opts.requesterName,
      actorName: opts.actorName,
      scheduledStartTime: opts.scheduledStartTime,
    });
    const payload = toPayload(doc);
    try {
      const io = getIO();
      io.to(`user:${opts.userId.toString()}`).emit("notification:new", payload);
    } catch (err) {
      console.error("[Notify] socket emit failed:", err);
    }
    sendPushToUser(opts.userId.toString(), payload).catch((err) =>
      console.error("[Notify] web-push failed:", err)
    );
    return payload;
  } catch (err) {
    console.error("[Notify] create failed:", err);
    return null;
  }
}

async function createBulk(
  userIds: Array<string | Types.ObjectId>,
  shared: Omit<CreateOpts, "userId">
): Promise<void> {
  await Promise.all(
    userIds.map((userId) => createNotification({ ...shared, userId }))
  );
}

export async function notifyTranscriptStatus(
  meetingId: string,
  status: "completed" | "failed"
): Promise<void> {
  try {
    const meeting = await Meeting.findById(meetingId)
      .select("title participants.userId")
      .lean();
    if (!meeting) return;

    const title = meeting.title ?? "Untitled meeting";
    const isOk = status === "completed";

    // Live cache-update event (existing)
    const io = getIO();
    for (const p of meeting.participants) {
      io.to(`user:${p.userId.toString()}`).emit("transcript-ready", {
        meetingId,
        status,
      });
    }

    await createBulk(
      meeting.participants.map((p) => p.userId),
      {
        type: isOk ? "transcript-ready" : "transcript-failed",
        title: isOk ? "Transcript ready" : "Transcript failed",
        body: isOk
          ? `Transcript for "${title}" is ready.`
          : `We couldn't transcribe "${title}". You can still listen to the recording.`,
        meetingId,
      }
    );
  } catch (err) {
    console.error("[Notify] transcript status failed:", err);
  }
}

export async function notifyNotesStatus(
  meetingId: string,
  status: "completed" | "failed"
): Promise<void> {
  try {
    const meeting = await Meeting.findById(meetingId)
      .select("title participants.userId")
      .lean();
    if (!meeting) return;

    const title = meeting.title ?? "Untitled meeting";
    const isOk = status === "completed";

    const io = getIO();
    for (const p of meeting.participants) {
      io.to(`user:${p.userId.toString()}`).emit("notes-ready", {
        meetingId,
        status,
      });
    }

    await createBulk(
      meeting.participants.map((p) => p.userId),
      {
        type: isOk ? "notes-ready" : "notes-failed",
        title: isOk ? "Meeting notes ready" : "Notes generation failed",
        body: isOk
          ? `AI-generated notes for "${title}" are ready to read.`
          : `We couldn't generate notes for "${title}".`,
        meetingId,
      }
    );
  } catch (err) {
    console.error("[Notify] notes status failed:", err);
  }
}

const STATE_TITLES: Record<MeetingStateChangeKind, string> = {
  created: "New meeting invitation",
  updated: "Meeting updated",
  cancelled: "Meeting cancelled",
  "series-cancelled": "Recurring meeting cancelled",
  started: "Meeting started",
};

const STATE_TYPES: Record<MeetingStateChangeKind, NotificationType> = {
  created: "meeting-invited",
  updated: "meeting-updated",
  cancelled: "meeting-cancelled",
  "series-cancelled": "meeting-series-cancelled",
  started: "meeting-started",
};

export async function notifyMeetingStateChanged(
  meetingIds: string[],
  kind: MeetingStateChangeKind,
  actorUserId?: string
): Promise<void> {
  if (meetingIds.length === 0) return;
  try {
    const io = getIO();
    const meetings = await Meeting.find({ _id: { $in: meetingIds } })
      .select("createdBy invitedUserIds title roomId scheduledStartTime")
      .lean();

    // Batch-fetch host display names so the bell can show "Hosted by <name>".
    const hostIds = Array.from(new Set(meetings.map((m) => m.createdBy.toString())));
    const hosts = await User.find({ _id: { $in: hostIds } })
      .select("displayName")
      .lean();
    const hostNameById = new Map(hosts.map((u) => [u._id.toString(), u.displayName]));

    for (const m of meetings) {
      // Audience: invitees + host. For `started`, skip the host since they're already in.
      // Also drop the actor — no point telling Mihir he cancelled his own meeting.
      const audience = new Set<string>();
      for (const id of m.invitedUserIds ?? []) audience.add(id.toString());
      if (kind !== "started") audience.add(m.createdBy.toString());
      if (actorUserId) audience.delete(actorUserId);

      for (const userId of audience) {
        io.to(`user:${userId}`).emit("meeting-state-changed", {
          meetingId: m._id.toString(),
          kind,
        });
      }

      const title = m.title ?? "Untitled meeting";
      const actorName = hostNameById.get(m.createdBy.toString());
      await createBulk(Array.from(audience), {
        type: STATE_TYPES[kind],
        title,
        body: STATE_TITLES[kind],
        meetingId: m._id.toString(),
        roomId: m.roomId,
        actorName,
        scheduledStartTime: m.scheduledStartTime ?? null,
      });
    }
  } catch (err) {
    console.error("[Notify] meeting-state-changed failed:", err);
  }
}

export async function notifyHostJoinRequestMissed(
  hostUserId: string,
  roomId: string,
  requesterName: string,
  meetingId?: string
): Promise<void> {
  await createNotification({
    userId: hostUserId,
    type: "join-request-missed",
    title: "Someone tried to join",
    body: `${requesterName} is waiting to join your meeting.`,
    roomId,
    requesterName,
    meetingId,
  });
}
