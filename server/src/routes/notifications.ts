import { Router } from "express";
import { Types } from "mongoose";
import { requireAuth } from "../middleware/auth";
import { Notification } from "../models/Notification";
import { PushSubscription } from "../models/PushSubscription";
import { config } from "../config/index";

const router = Router();

function qp(val: unknown): string | undefined {
  const s = Array.isArray(val) ? val[0] : val;
  return typeof s === "string" && s ? s : undefined;
}

router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = new Types.ObjectId(req.user!.userId);
    const page = Math.max(parseInt(qp(req.query.page) ?? "1") || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(qp(req.query.limit) ?? "20") || 20, 1),
      100
    );

    const [docs, total, unread] = await Promise.all([
      Notification.find({ userId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ userId }),
      Notification.countDocuments({ userId, readAt: null }),
    ]);

    res.json({
      notifications: docs.map((n) => ({
        id: n._id.toString(),
        type: n.type,
        title: n.title,
        body: n.body,
        meetingId: n.meetingId?.toString(),
        roomId: n.roomId,
        requesterName: n.requesterName,
        readAt: n.readAt ? n.readAt.toISOString() : null,
        createdAt: n.createdAt.toISOString(),
      })),
      total,
      unread,
      page,
      limit,
    });
  } catch (err) {
    console.error("Failed to list notifications:", err);
    res.status(500).json({ message: "Failed to list notifications" });
  }
});

router.get("/unread-count", requireAuth, async (req, res) => {
  try {
    const userId = new Types.ObjectId(req.user!.userId);
    const unread = await Notification.countDocuments({ userId, readAt: null });
    res.json({ unread });
  } catch (err) {
    console.error("Failed to fetch unread count:", err);
    res.status(500).json({ message: "Failed to fetch unread count" });
  }
});

router.patch("/read-all", requireAuth, async (req, res) => {
  try {
    const userId = new Types.ObjectId(req.user!.userId);
    const now = new Date();
    const result = await Notification.updateMany(
      { userId, readAt: null },
      { $set: { readAt: now } }
    );
    res.json({ markedCount: result.modifiedCount ?? 0 });
  } catch (err) {
    console.error("Failed to mark all read:", err);
    res.status(500).json({ message: "Failed to mark all read" });
  }
});

router.patch("/:id/read", requireAuth, async (req, res) => {
  try {
    const userId = new Types.ObjectId(req.user!.userId);
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!Types.ObjectId.isValid(idParam)) {
      res.status(400).json({ message: "Invalid notification id" });
      return;
    }
    const updated = await Notification.findOneAndUpdate(
      { _id: idParam, userId },
      { $set: { readAt: new Date() } },
      { new: true }
    ).lean();
    if (!updated) {
      res.status(404).json({ message: "Notification not found" });
      return;
    }
    res.json({ id: idParam, readAt: updated.readAt?.toISOString() ?? null });
  } catch (err) {
    console.error("Failed to mark read:", err);
    res.status(500).json({ message: "Failed to mark read" });
  }
});

router.get("/push/public-key", requireAuth, (_req, res) => {
  res.json({ publicKey: config.webPush.publicKey });
});

router.post("/push/subscribe", requireAuth, async (req, res) => {
  try {
    const userId = new Types.ObjectId(req.user!.userId);
    const { endpoint, keys, userAgent } = req.body ?? {};
    if (
      typeof endpoint !== "string" ||
      !keys ||
      typeof keys.p256dh !== "string" ||
      typeof keys.auth !== "string"
    ) {
      res.status(400).json({ message: "Invalid subscription payload" });
      return;
    }

    // Upsert by endpoint — re-subscribes from the same browser shouldn't pile up.
    await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        $set: {
          userId,
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          userAgent: typeof userAgent === "string" ? userAgent : undefined,
        },
      },
      { upsert: true, new: true }
    );
    res.json({ subscribed: true });
  } catch (err) {
    console.error("Failed to subscribe push:", err);
    res.status(500).json({ message: "Failed to subscribe" });
  }
});

router.post("/push/unsubscribe", requireAuth, async (req, res) => {
  try {
    const userId = new Types.ObjectId(req.user!.userId);
    const { endpoint } = req.body ?? {};
    if (typeof endpoint !== "string") {
      res.status(400).json({ message: "Endpoint required" });
      return;
    }
    await PushSubscription.deleteOne({ endpoint, userId });
    res.json({ unsubscribed: true });
  } catch (err) {
    console.error("Failed to unsubscribe push:", err);
    res.status(500).json({ message: "Failed to unsubscribe" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const userId = new Types.ObjectId(req.user!.userId);
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!Types.ObjectId.isValid(idParam)) {
      res.status(400).json({ message: "Invalid notification id" });
      return;
    }
    const result = await Notification.deleteOne({ _id: idParam, userId });
    if (result.deletedCount === 0) {
      res.status(404).json({ message: "Notification not found" });
      return;
    }
    res.json({ deleted: true });
  } catch (err) {
    console.error("Failed to delete notification:", err);
    res.status(500).json({ message: "Failed to delete notification" });
  }
});

export default router;
