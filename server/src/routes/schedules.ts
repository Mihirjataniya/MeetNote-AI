import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { scheduleService, ScheduleError } from "../services/scheduleService";
import { Meeting } from "../models/Meeting";
import { User } from "../models/User";
import { buildIcs } from "../utils/icsBuilder";
import { notifyMeetingStateChanged } from "../services/notificationService";
import { config } from "../config/index";
import type { ScheduleMeetingDTO, UpdateScheduleDTO } from "../types/index";

const router = Router();

function qp(val: unknown): string | undefined {
  const s = Array.isArray(val) ? val[0] : val;
  return typeof s === "string" && s ? s : undefined;
}

function handleError(err: unknown, res: import("express").Response): void {
  if (err instanceof ScheduleError) {
    res.status(err.status).json({ message: err.message, code: err.code });
    return;
  }
  console.error("[Schedules] internal error:", err);
  res.status(500).json({ message: "Internal server error" });
}

router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const dto = req.body as ScheduleMeetingDTO;
    const { created, clipped } = await scheduleService.createScheduled(userId, dto);
    notifyMeetingStateChanged(created.map((c) => c.id), "created").catch((e) =>
      console.error("[Schedules] notify failed:", e)
    );
    res.status(201).json({ schedules: created, clipped });
  } catch (err) {
    handleError(err, res);
  }
});

router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const from = qp(req.query.from);
    const to = qp(req.query.to);
    const page = parseInt(qp(req.query.page) ?? "1") || 1;
    const limit = parseInt(qp(req.query.limit) ?? "100") || 100;

    const result = await scheduleService.listUserSchedules(userId, {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      page,
      limit,
    });
    res.json(result);
  } catch (err) {
    handleError(err, res);
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const schedule = await scheduleService.getScheduled(id, userId);
    res.json(schedule);
  } catch (err) {
    handleError(err, res);
  }
});

router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const dto = req.body as UpdateScheduleDTO;
    const updated = await scheduleService.updateScheduled(id, userId, dto);
    notifyMeetingStateChanged([updated.id], "updated").catch((e) =>
      console.error("[Schedules] notify failed:", e)
    );
    res.json(updated);
  } catch (err) {
    handleError(err, res);
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await scheduleService.cancelScheduled(id, userId);
    notifyMeetingStateChanged([id], "cancelled").catch((e) =>
      console.error("[Schedules] notify failed:", e)
    );
    res.json({ ok: true });
  } catch (err) {
    handleError(err, res);
  }
});

router.delete("/:id/series", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const count = await scheduleService.cancelSeries(id, userId);
    notifyMeetingStateChanged([id], "series-cancelled").catch((e) =>
      console.error("[Schedules] notify failed:", e)
    );
    res.json({ ok: true, cancelledCount: count });
  } catch (err) {
    handleError(err, res);
  }
});

router.get("/:id/ics", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const meeting = await Meeting.findById(id);
    if (!meeting) {
      res.status(404).json({ message: "Meeting not found" });
      return;
    }
    scheduleService.assertVisible(meeting as unknown as import("../models/Meeting").IMeeting, userId);

    const host = await User.findById(meeting.createdBy).select("displayName email").lean();
    if (!host) {
      res.status(404).json({ message: "Host not found" });
      return;
    }
    const attendees = await scheduleService.getAttendeeEmails(meeting as unknown as import("../models/Meeting").IMeeting);
    const joinUrl = `${config.appUrl}/room/${meeting.roomId}?scheduledMeetingId=${meeting._id.toString()}`;
    const ics = buildIcs({
      meeting: meeting as unknown as import("../models/Meeting").IMeeting,
      host,
      attendees,
      joinUrl,
    });

    const filename = `${(meeting.title || "meeting").replace(/[^a-z0-9-_]+/gi, "_")}.ics`;
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(ics);
  } catch (err) {
    handleError(err, res);
  }
});

export default router;
