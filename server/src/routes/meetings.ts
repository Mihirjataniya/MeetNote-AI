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

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
    const transcriptStatus = qp(req.query.transcriptStatus);
    const userId = req.user!.userId;

    let meetingDocs: Array<{
      _id: Types.ObjectId;
      title?: string;
      status: string;
      participants: Array<{ userId: Types.ObjectId; displayName: string }>;
      durationMs?: number;
      startedAt?: Date;
      endedAt?: Date;
    }>;
    let total: number;

    if (transcriptStatus) {
      const matchStage: Record<string, unknown> = {
        "participants.userId": new Types.ObjectId(userId),
      };
      if (q) matchStage.title = { $regex: escapeRegex(q), $options: "i" };
      if (status) matchStage.status = status;

      const tsMatch =
        transcriptStatus === "none"
          ? { _transcriptStatus: "none" }
          : { _transcriptStatus: transcriptStatus };

      const pipeline = [
        { $match: matchStage },
        {
          $lookup: {
            from: "transcripts",
            localField: "_id",
            foreignField: "meetingId",
            as: "_transcript",
          },
        },
        {
          $addFields: {
            _transcriptStatus: {
              $ifNull: [{ $arrayElemAt: ["$_transcript.status", 0] }, "none"],
            },
          },
        },
        { $match: tsMatch },
        {
          $facet: {
            metadata: [{ $count: "total" }],
            data: [
              { $sort: { createdAt: -1 as const } },
              { $skip: (page - 1) * limit },
              { $limit: limit },
            ],
          },
        },
      ];

      const [result] = await Meeting.aggregate(pipeline);
      total = result.metadata[0]?.total ?? 0;
      meetingDocs = result.data;
    } else {
      const paginated = await meetingService.getUserMeetingsPaginated(userId, {
        page,
        limit,
        q,
        status,
      });
      meetingDocs = paginated.meetings;
      total = paginated.total;
    }

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
      };
    });

    res.json({ meetings, total, page, limit });
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
