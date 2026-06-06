import { Router } from "express";
import { Types } from "mongoose";
import { requireAuth } from "../middleware/auth";
import { meetingService } from "../services/meetingService";
import { Meeting } from "../models/Meeting";
import { Transcript } from "../models/Transcript";
import { Recording } from "../models/Recording";

function qp(val: unknown): string | undefined {
  const s = Array.isArray(val) ? val[0] : val;
  return typeof s === "string" && s ? s : undefined;
}

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const page = Math.max(parseInt(qp(req.query.page) ?? "1") || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(qp(req.query.limit) ?? "20") || 20, 1),
      100
    );
    const q = qp(req.query.q);
    const status = qp(req.query.status);
    const userId = req.user!.userId;

    const paginated = await meetingService.getUserMeetingsPaginated(userId, {
      page,
      limit,
      q,
      status,
    });
    const meetingDocs = paginated.meetings;
    const total = paginated.total;

    const meetingIds = meetingDocs.map((m) => m._id);
    const [transcripts, recordings] = await Promise.all([
      Transcript.find({ meetingId: { $in: meetingIds } })
        .select("meetingId status notesStatus")
        .lean(),
      Recording.find({ meetingId: { $in: meetingIds } })
        .select("meetingId status durationMs")
        .lean(),
    ]);

    const transcriptMap = new Map(
      transcripts.map((t) => [t.meetingId.toString(), t])
    );
    const recordingMap = new Map(
      recordings.map((r) => [r.meetingId.toString(), r])
    );

    const meetings = meetingDocs.map((m) => {
      const id = m._id.toString();
      const transcript = transcriptMap.get(id);
      const recording = recordingMap.get(id);
      const pinned = (m.pinnedBy ?? []).some((u) => u.toString() === userId);
      return {
        id,
        title: m.title,
        status: m.status,
        participantCount: m.participants.length,
        durationMs: m.durationMs ?? recording?.durationMs,
        startedAt: m.startedAt,
        endedAt: m.endedAt,
        transcriptStatus: transcript?.status ?? null,
        notesStatus: transcript?.notesStatus ?? null,
        recordingStatus: recording?.status ?? null,
        pinned,
      };
    });

    res.json({ meetings, total, page, limit });
  } catch (err) {
    console.error("Failed to fetch meetings:", err);
    res.status(500).json({ message: "Failed to fetch meetings" });
  }
});

router.get("/stats", requireAuth, async (req, res) => {
  try {
    const userId = new Types.ObjectId(req.user!.userId);
    const now = new Date();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prevWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const participantMatch = { "participants.userId": userId };

    const [
      recentMeetings,
      allEndedMeetings,
      meetingIdsForTranscripts,
    ] = await Promise.all([
      Meeting.find({
        ...participantMatch,
        status: "ended",
        endedAt: { $gte: prevWeekStart, $lte: now },
      })
        .select("endedAt durationMs")
        .lean(),
      Meeting.find({
        ...participantMatch,
        status: "ended",
        durationMs: { $gt: 0 },
      })
        .select("durationMs")
        .lean(),
      Meeting.find(participantMatch).distinct("_id"),
    ]);

    const thisWeek = recentMeetings.filter(
      (m) => m.endedAt && m.endedAt >= weekStart
    );
    const lastWeek = recentMeetings.filter(
      (m) => m.endedAt && m.endedAt < weekStart
    );

    const thisWeekHoursMs = thisWeek.reduce(
      (s, m) => s + (m.durationMs ?? 0),
      0
    );
    const lastWeekHoursMs = lastWeek.reduce(
      (s, m) => s + (m.durationMs ?? 0),
      0
    );
    const thisWeekHours = thisWeekHoursMs / 3600000;
    const lastWeekHours = lastWeekHoursMs / 3600000;

    const notesCompleted = await Transcript.countDocuments({
      meetingId: { $in: meetingIdsForTranscripts },
      notesStatus: "completed",
    });
    const transcriptsTotal = await Transcript.countDocuments({
      meetingId: { $in: meetingIdsForTranscripts },
    });

    const avgDurationMs = allEndedMeetings.length
      ? allEndedMeetings.reduce((s, m) => s + (m.durationMs ?? 0), 0) /
        allEndedMeetings.length
      : 0;
    const avgDurationMin = Math.round(avgDurationMs / 60000);

    res.json({
      meetingsThisWeek: {
        value: thisWeek.length,
        delta: thisWeek.length - lastWeek.length,
      },
      hoursThisWeek: {
        value: Number(thisWeekHours.toFixed(1)),
        delta: Number((thisWeekHours - lastWeekHours).toFixed(1)),
      },
      notesGenerated: {
        value: notesCompleted,
        total: transcriptsTotal,
      },
      avgMeetingMin: { value: avgDurationMin },
    });
  } catch (err) {
    console.error("Failed to fetch meeting stats:", err);
    res.status(500).json({ message: "Failed to fetch meeting stats" });
  }
});

router.get("/pinned", requireAuth, async (req, res) => {
  try {
    const userId = new Types.ObjectId(req.user!.userId);
    const limit = Math.min(
      Math.max(parseInt(qp(req.query.limit) ?? "10") || 10, 1),
      50
    );

    const meetings = await Meeting.find({ pinnedBy: userId })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .select(
        "title status startedAt endedAt durationMs participants roomId scheduledStartTime scheduledDurationMin createdBy"
      )
      .lean();

    const ids = meetings.map((m) => m._id);
    const transcripts = await Transcript.find({ meetingId: { $in: ids } })
      .select("meetingId notesStatus")
      .lean();
    const notesMap = new Map(
      transcripts.map((t) => [t.meetingId.toString(), t.notesStatus ?? null])
    );

    const viewerId = req.user!.userId;
    res.json({
      meetings: meetings.map((m) => ({
        id: m._id.toString(),
        title: m.title,
        status: m.status,
        roomId: m.roomId,
        startedAt: m.startedAt,
        endedAt: m.endedAt,
        scheduledStartTime: m.scheduledStartTime,
        scheduledDurationMin: m.scheduledDurationMin,
        durationMs: m.durationMs,
        participantCount: m.participants.length,
        notesStatus: notesMap.get(m._id.toString()) ?? null,
        isHost: m.createdBy.toString() === viewerId,
      })),
    });
  } catch (err) {
    console.error("Failed to fetch pinned meetings:", err);
    res.status(500).json({ message: "Failed to fetch pinned meetings" });
  }
});

router.patch("/:id/pin", requireAuth, async (req, res) => {
  try {
    const userId = new Types.ObjectId(req.user!.userId);
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!Types.ObjectId.isValid(idParam)) {
      res.status(400).json({ message: "Invalid meeting id" });
      return;
    }
    const pinned = req.body?.pinned === true;

    const meeting = await Meeting.findOne({
      _id: idParam,
      "participants.userId": userId,
    }).select("_id");
    if (!meeting) {
      res.status(404).json({ message: "Meeting not found" });
      return;
    }

    await Meeting.updateOne(
      { _id: idParam },
      pinned
        ? { $addToSet: { pinnedBy: userId } }
        : { $pull: { pinnedBy: userId } }
    );

    res.json({ id: idParam, pinned });
  } catch (err) {
    console.error("Failed to toggle pin:", err);
    res.status(500).json({ message: "Failed to toggle pin" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const meeting = await meetingService.getMeetingById(id);
    if (!meeting) {
      res.status(404).json({ message: "Meeting not found" });
      return;
    }

    const [transcript, recording] = await Promise.all([
      Transcript.findOne({ meetingId: meeting._id })
        .select("status notesStatus")
        .lean(),
      Recording.findOne({ meetingId: meeting._id })
        .select("status durationMs cloudinaryUrls")
        .lean(),
    ]);

    res.json({
      id: meeting._id.toString(),
      title: meeting.title,
      agenda: meeting.agenda,
      status: meeting.status,
      participants: meeting.participants.map((p) => ({
        displayName: p.displayName,
        role: p.role,
        joinedAt: p.joinedAt,
        leftAt: p.leftAt,
      })),
      durationMs: meeting.durationMs ?? recording?.durationMs,
      startedAt: meeting.startedAt,
      endedAt: meeting.endedAt,
      transcriptStatus: transcript?.status ?? null,
      notesStatus: transcript?.notesStatus ?? null,
      recordingStatus: recording?.status ?? null,
      cloudinaryUrls: recording?.cloudinaryUrls ?? [],
      pinned: (meeting.pinnedBy ?? []).some(
        (u) => u.toString() === req.user!.userId
      ),
    });
  } catch (err) {
    console.error("Failed to fetch meeting:", err);
    res.status(500).json({ message: "Failed to fetch meeting" });
  }
});

router.get("/:id/notes", requireAuth, async (req, res) => {
  try {
    const meetingId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const transcript = await Transcript.findOne({ meetingId })
      .select("meetingNotes notesStatus")
      .lean();

    if (!transcript || !transcript.meetingNotes) {
      res.status(404).json({ message: "Meeting notes not found" });
      return;
    }

    res.json({
      meetingId,
      meetingNotes: transcript.meetingNotes,
      notesStatus: transcript.notesStatus,
    });
  } catch (err) {
    console.error("Failed to fetch meeting notes:", err);
    res.status(500).json({ message: "Failed to fetch meeting notes" });
  }
});

export default router;
