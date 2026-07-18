import { Router } from "express";
import { authService } from "../services/authService";
import { userService } from "../services/userService";
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
    if (!password || typeof password !== "string" || password.length < 8) {
      res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
      return;
    }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      res.status(400).json({
        message: "Password must contain at least one letter and one number",
      });
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
        createdAt: user.createdAt.toISOString(),
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
        createdAt: user.createdAt.toISOString(),
      },
    };
    res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    res.status(401).json({ message });
  }
});

router.post("/google", async (req, res) => {
  try {
    const { idToken } = req.body as { idToken?: string };
    if (!idToken || typeof idToken !== "string") {
      res.status(400).json({ message: "idToken is required" });
      return;
    }

    const { user, token } = await authService.loginWithGoogle(idToken);

    const response: AuthResponse = {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
        createdAt: user.createdAt.toISOString(),
      },
    };
    res.json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Google sign-in failed";
    res.status(401).json({ message });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  // Fetch from DB so profile updates are reflected without re-issuing the JWT.
  try {
    const user = await userService.getById(req.user!.userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("[Auth] /me failed:", err);
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

export default router;
