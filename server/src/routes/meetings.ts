import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { meetingService } from "../services/meetingService";
import { Transcript } from "../models/Transcript";
import { Recording } from "../models/Recording";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const limitParam = Array.isArray(req.query.limit)
      ? req.query.limit[0]
      : req.query.limit;
    const limit = Math.min(
      parseInt(limitParam as string) || 20,
      100
    );
    const meetings = await meetingService.getUserMeetings(
      req.user!.userId,
      limit
    );

    const meetingIds = meetings.map((m) => m._id);
    const [transcripts, recordings] = await Promise.all([
      Transcript.find({ meetingId: { $in: meetingIds } })
        .select("meetingId status")
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

    const result = meetings.map((m) => {
      const id = m._id.toString();
      const transcript = transcriptMap.get(id);
      const recording = recordingMap.get(id);
      return {
        id,
        title: m.title,
        status: m.status,
        participantCount: m.participants.length,
        durationMs: m.durationMs ?? recording?.durationMs,
        startedAt: m.startedAt,
        endedAt: m.endedAt,
        transcriptStatus: transcript?.status ?? null,
        recordingStatus: recording?.status ?? null,
      };
    });

    res.json({ meetings: result });
  } catch (err) {
    console.error("Failed to fetch meetings:", err);
    res.status(500).json({ message: "Failed to fetch meetings" });
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
        .select("status")
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
      recordingStatus: recording?.status ?? null,
      cloudinaryUrls: recording?.cloudinaryUrls ?? [],
    });
  } catch (err) {
    console.error("Failed to fetch meeting:", err);
    res.status(500).json({ message: "Failed to fetch meeting" });
  }
});

router.get("/:id/transcript", requireAuth, async (req, res) => {
  try {
    const meetingId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const transcript = await Transcript.findOne({
      meetingId,
    }).lean();

    if (!transcript) {
      res.status(404).json({ message: "Transcript not found" });
      return;
    }

    res.json({
      id: transcript._id.toString(),
      meetingId: transcript.meetingId.toString(),
      status: transcript.status,
      language: transcript.language,
      segments: transcript.segments,
      fullText: transcript.fullText,
      createdAt: transcript.createdAt,
      updatedAt: transcript.updatedAt,
    });
  } catch (err) {
    console.error("Failed to fetch transcript:", err);
    res.status(500).json({ message: "Failed to fetch transcript" });
  }
});

export default router;
