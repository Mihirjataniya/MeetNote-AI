import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { User } from "../models/User";
import { config } from "../config/index";
import type { IUser } from "../models/User";
import type { JwtPayload } from "../types/index";

class AuthService {
  private readonly SALT_ROUNDS = 10;
  private readonly googleClient = new OAuth2Client(config.google.clientId);

  async register(
    email: string,
    password: string,
    displayName: string
  ): Promise<{ user: IUser; token: string }> {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new Error("Email already registered");
    }

    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);
    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      displayName: displayName.trim(),
    });

    const token = this.generateToken(user);
    return { user, token };
  }

  async login(
    email: string,
    password: string
  ): Promise<{ user: IUser; token: string }> {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Google-only account (no password set) — steer them to the Google button
    // instead of leaking that the email exists via a bcrypt error.
    if (!user.password) {
      throw new Error("This account uses Google sign-in");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("Invalid email or password");
    }

    const token = this.generateToken(user);
    return { user, token };
  }

  async loginWithGoogle(
    idToken: string
  ): Promise<{ user: IUser; token: string }> {
    if (!config.google.clientId) {
      throw new Error("Google sign-in is not configured");
    }

    const ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience: config.google.clientId,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.email_verified) {
      throw new Error("Google account email is not verified");
    }

    const email = payload.email.toLowerCase();
    const googleId = payload.sub;
    const displayName = (payload.name || email.split("@")[0]).slice(0, 50);

    // 1) Already linked → sign straight in.
    let user = await User.findOne({ googleId });

    // 2) Existing account with the same (Google-verified) email → auto-link.
    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        user.googleId = googleId;
        await user.save();
      }
    }

    // 3) Brand new → create a Google-provider account (no password).
    if (!user) {
      user = await User.create({
        email,
        googleId,
        displayName,
        authProvider: "google",
      });
    }

    const token = this.generateToken(user);
    return { user, token };
  }

  verifyToken(token: string): JwtPayload {
    return jwt.verify(token, config.jwt.secret) as JwtPayload;
  }

  private generateToken(user: IUser): string {
    const payload: JwtPayload = {
      userId: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
    };
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as string & jwt.SignOptions["expiresIn"],
    });
  }
}

export const authService = new AuthService();
