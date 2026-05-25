import { Router } from "express";
import multer from "multer";
import path from "node:path";
import { requireAuth } from "../middleware/auth";
import { recordingService } from "../services/recordingService";

const upload = multer({
  storage: multer.diskStorage({
    destination(_req, _file, cb) {
      const roomId = _req.body.roomId;
      const dir = recordingService.getUploadDir(roomId);
      if (!dir) {
        cb(new Error("No active recording for this room"), "");
        return;
      }
      cb(null, dir);
    },
    filename(_req, file, cb) {
      const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const ext = path.extname(file.originalname) || ".webm";
      cb(null, `${unique}${ext}`);
    },
  }),
  limits: { fileSize: 100 * 1024 * 1024 },
});

const router = Router();

router.post("/upload", requireAuth, upload.single("audio"), (req, res) => {
  const { roomId } = req.body;

  if (!roomId || !req.file) {
    res.status(400).json({ message: "roomId and audio file are required" });
    return;
  }

  if (!recordingService.isRecording(roomId)) {
    res.status(404).json({ message: "No active recording for this room" });
    return;
  }

  recordingService.addUploadedFile(roomId, req.file.path);
  res.json({ success: true });
});

export default router;
