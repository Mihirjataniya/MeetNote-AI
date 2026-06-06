import { Router } from "express";
import authRoutes from "./auth";
import meetingRoutes from "./meetings";
import recordingRoutes from "./recordings";
import chatRoutes from "./chat";
import schedulesRoutes from "./schedules";
import usersRoutes from "./users";
import notificationsRoutes from "./notifications";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.use("/auth", authRoutes);
router.use("/meetings", meetingRoutes);
router.use("/recordings", recordingRoutes);
router.use("/chat", chatRoutes);
router.use("/schedules", schedulesRoutes);
router.use("/users", usersRoutes);
router.use("/notifications", notificationsRoutes);

export default router;
