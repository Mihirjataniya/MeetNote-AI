import { Router } from "express";
import authRoutes from "./auth";
import meetingRoutes from "./meetings";
import recordingRoutes from "./recordings";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.use("/auth", authRoutes);
router.use("/meetings", meetingRoutes);
router.use("/recordings", recordingRoutes);

export default router;
