import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { userService } from "../services/userService";

const router = Router();

function qp(val: unknown): string | undefined {
  const s = Array.isArray(val) ? val[0] : val;
  return typeof s === "string" && s ? s : undefined;
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

export default router;
