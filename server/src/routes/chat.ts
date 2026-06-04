import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { roomService } from "../services/roomService";
import { ChatMessage } from "../models/ChatMessage";

const router = Router();

router.get("/:roomId/messages", requireAuth, async (req, res) => {
  try {
    const roomId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
    const room = roomService.getRoom(roomId);
    if (!room || !room.meetingId) {
      res.status(404).json({ message: "Room not found" });
      return;
    }

    const messages = await ChatMessage.find({ meetingId: room.meetingId })
      .sort({ createdAt: 1 })
      .lean();

    res.json({
      messages: messages.map((m) => ({
        id: m._id.toString(),
        userId: m.userId.toString(),
        displayName: m.displayName,
        text: m.text,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("Failed to fetch chat messages:", err);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

export default router;
