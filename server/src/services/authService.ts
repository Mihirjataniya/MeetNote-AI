import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { config } from "../config/index";
import type { IUser } from "../models/User";
import type { JwtPayload } from "../types/index";

class AuthService {
  private readonly SALT_ROUNDS = 10;

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

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("Invalid email or password");
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
