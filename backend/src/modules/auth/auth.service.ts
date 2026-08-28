import bcrypt from "bcryptjs";
import crypto from "crypto";

import { User } from "../users/user.model";
import { UserRepository } from "../users/user.repository";
import { Session } from "./session.model";
import {
  AuthenticatedUser,
  AuthSessionResult,
  LoginInput,
  RegisterInput,
} from "./auth.types";
import { UserRole } from "../../common/constants/roles";

const SESSION_DURATION_DAYS = 7;

export class AuthService {
  private readonly userRepository = new UserRepository();

  async register(input: RegisterInput) {
    const email = input.email.trim().toLowerCase();
    const username = input.username.trim();

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new Error(
        "Un compte utilisant cette adresse existe déjà."
      );
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await this.userRepository.create({
      email,
      passwordHash,
      role: UserRole.PLAYER,
      status: "ACTIVE",
      mustChangePassword: false,
      profile: {
        username,
      },
      discord: {
        linked: false,
      },
      paxDei: {},
      economy: {
        balances: new Map(),
      },
    });

    return this.toAuthenticatedUser(user);
  }

  async login(input: LoginInput) {
    const email = input.email.trim().toLowerCase();

    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new Error("Identifiants invalides.");
    }

    if (user.status !== "ACTIVE") {
      throw new Error("Ce compte n'est pas actif.");
    }

    const passwordValid = await bcrypt.compare(
      input.password,
      user.passwordHash
    );

    if (!passwordValid) {
      throw new Error("Identifiants invalides.");
    }

    return this.createSessionForUser(user);
  }

  async createSessionForUser(user: any): Promise<AuthSessionResult> {
    const sessionToken = crypto.randomBytes(32).toString("hex");

    const tokenHash = crypto
      .createHash("sha256")
      .update(sessionToken)
      .digest("hex");

    const expiresAt = new Date();

    expiresAt.setDate(
      expiresAt.getDate() + SESSION_DURATION_DAYS
    );

    await Session.create({
      userId: user._id,
      tokenHash,
      expiresAt,
    });

    return {
      user: this.toAuthenticatedUser(user),
      sessionToken,
      expiresAt,
    };
  }

  async getUserFromSession(
    sessionToken: string
  ): Promise<AuthenticatedUser | null> {
    const tokenHash = crypto
      .createHash("sha256")
      .update(sessionToken)
      .digest("hex");

    const session = await Session.findOne({
      tokenHash,
    });

    if (!session) {
      return null;
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      await Session.deleteOne({ _id: session._id });
      return null;
    }

    const user = await this.userRepository.findById(
      session.userId.toString()
    );

    if (!user || user.status !== "ACTIVE") {
      return null;
    }

    return this.toAuthenticatedUser(user);
  }

  async logout(sessionToken: string) {
    const tokenHash = crypto
      .createHash("sha256")
      .update(sessionToken)
      .digest("hex");

    await Session.deleteOne({ tokenHash });
  }

  private toAuthenticatedUser(user: any): AuthenticatedUser {
    return {
      id: user._id.toString(),
      email: user.email,
      username: user.profile.username,
      role: user.role,
      mustChangePassword: user.mustChangePassword ?? false,
    };
  }
}
