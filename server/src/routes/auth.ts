import { Router } from "express";
import { authService } from "../services/authService";
import { requireAuth } from "../middleware/auth";
import type {
  RegisterPayload,
  LoginPayload,
  AuthResponse,
} from "../types/index";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { email, password, displayName } = req.body as RegisterPayload;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      res.status(400).json({ message: "Valid email is required" });
      return;
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
      return;
    }
    if (
      !displayName ||
      typeof displayName !== "string" ||
      displayName.trim().length === 0 ||
      displayName.length > 50
    ) {
      res
        .status(400)
        .json({ message: "Display name is required (max 50 characters)" });
      return;
    }

    const { user, token } = await authService.register(
      email,
      password,
      displayName
    );

    const response: AuthResponse = {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
      },
    };
    res.status(201).json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Registration failed";
    const status = message === "Email already registered" ? 409 : 500;
    res.status(status).json({ message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body as LoginPayload;

    if (!email || typeof email !== "string") {
      res.status(400).json({ message: "Email is required" });
      return;
    }
    if (!password || typeof password !== "string") {
      res.status(400).json({ message: "Password is required" });
      return;
    }

    const { user, token } = await authService.login(email, password);

    const response: AuthResponse = {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
      },
    };
    res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    res.status(401).json({ message });
  }
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
