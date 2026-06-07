import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { userService, UserServiceError } from "../services/userService";

const router = Router();

function qp(val: unknown): string | undefined {
  const s = Array.isArray(val) ? val[0] : val;
  return typeof s === "string" && s ? s : undefined;
}

function handleError(err: unknown, res: import("express").Response, label: string): void {
  if (err instanceof UserServiceError) {
    res.status(err.status).json({ message: err.message, code: err.code });
    return;
  }
  console.error(`[Users] ${label} failed:`, err);
  res.status(500).json({ message: "Internal server error" });
}

router.get("/search", requireAuth, async (req, res) => {
  try {
    const q = qp(req.query.q) ?? "";
    const limit = parseInt(qp(req.query.limit) ?? "10") || 10;
    const users = await userService.search(q, req.user!.userId, limit);
    res.json({ users });
  } catch (err) {
    console.error("[Users] search failed:", err);
    res.status(500).json({ message: "Search failed" });
  }
});

router.patch("/me", requireAuth, async (req, res) => {
  try {
    const { displayName, email } = (req.body ?? {}) as {
      displayName?: unknown;
      email?: unknown;
    };
    const patch: { displayName?: string; email?: string } = {};
    if (typeof displayName === "string") patch.displayName = displayName;
    if (typeof email === "string") patch.email = email;

    const user = await userService.updateProfile(req.user!.userId, patch);
    res.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
      },
    });
  } catch (err) {
    handleError(err, res, "update profile");
  }
});

router.patch("/me/password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = (req.body ?? {}) as {
      currentPassword?: unknown;
      newPassword?: unknown;
    };
    if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
      res.status(400).json({ message: "currentPassword and newPassword are required" });
      return;
    }
    await userService.updatePassword(req.user!.userId, currentPassword, newPassword);
    res.json({ ok: true });
  } catch (err) {
    handleError(err, res, "update password");
  }
});

export default router;
