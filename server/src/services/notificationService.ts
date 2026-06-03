import { getIO } from "../socket/index";
import { Meeting } from "../models/Meeting";

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
