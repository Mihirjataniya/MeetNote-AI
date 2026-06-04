import { getIO } from "../socket/index";
import { Meeting } from "../models/Meeting";
import type { MeetingStateChangeKind } from "../types/index";

export async function notifyTranscriptStatus(
  meetingId: string,
  status: "completed" | "failed"
): Promise<void> {
  try {
    const io = getIO();
    const meeting = await Meeting.findById(meetingId)
      .select("participants.userId")
      .lean();
    if (!meeting) return;

    for (const p of meeting.participants) {
      io.to(`user:${p.userId.toString()}`).emit("transcript-ready", {
        meetingId,
        status,
      });
    }
    console.log(
      `[Notify] transcript-ready (${status}) → ${meeting.participants.length} participant(s) for meeting ${meetingId}`
    );
  } catch (err) {
    console.error("[Notify] Failed to send transcript-ready:", err);
  }
}

export async function notifyNotesStatus(
  meetingId: string,
  status: "completed" | "failed"
): Promise<void> {
  try {
    const io = getIO();
    const meeting = await Meeting.findById(meetingId)
      .select("participants.userId")
      .lean();
    if (!meeting) return;

    for (const p of meeting.participants) {
      io.to(`user:${p.userId.toString()}`).emit("notes-ready", {
        meetingId,
        status,
      });
    }
    console.log(
      `[Notify] notes-ready (${status}) → ${meeting.participants.length} participant(s) for meeting ${meetingId}`
    );
  } catch (err) {
    console.error("[Notify] Failed to send notes-ready:", err);
  }
}

export async function notifyMeetingStateChanged(
  meetingIds: string[],
  kind: MeetingStateChangeKind
): Promise<void> {
  if (meetingIds.length === 0) return;
  try {
    const io = getIO();
    const meetings = await Meeting.find({ _id: { $in: meetingIds } })
      .select("createdBy invitedUserIds")
      .lean();
    for (const m of meetings) {
      const audience = new Set<string>([m.createdBy.toString()]);
      for (const id of m.invitedUserIds ?? []) audience.add(id.toString());
      for (const userId of audience) {
        io.to(`user:${userId}`).emit("meeting-state-changed", {
          meetingId: m._id.toString(),
          kind,
        });
      }
    }
  } catch (err) {
    console.error("[Notify] meeting-state-changed failed:", err);
  }
}
