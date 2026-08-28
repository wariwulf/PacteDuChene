import bcrypt from "bcryptjs";
import crypto from "crypto";
import { User } from "./user.model";
import { clanRepository } from "../clan/clan.repository";
import { UserRole } from "../../common/constants/roles";
import {
  linkDiscord,
  unlinkDiscord,
} from "../discord/discord.service";

type ActorRole = "PLAYER" | "MODERATOR" | "ADMIN" | "OWNER";

type CreateMemberInput = {
  email: string;
  username: string;
  displayName?: string;
  role?: UserRole;
  avatar?: string;
  discordId?: string;
  discordUsername?: string;
};

type UpdateMemberInput = {
  email?: string;
  username?: string;
  displayName?: string;
  role?: UserRole;
  avatar?: string;
  discordId?: string;
  discordUsername?: string;
};

function generateTemporaryPassword(length = 14) {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const bytes = crypto.randomBytes(length);
  let result = "";

  for (let i = 0; i < length; i += 1) {
    result += alphabet[bytes[i] % alphabet.length];
  }

  return result;
}

function canManageRole(actorRole: ActorRole, targetRole: UserRole) {
  if (targetRole === UserRole.OWNER) {
    return actorRole === "OWNER";
  }

  if (targetRole === UserRole.ADMIN) {
    return actorRole === "OWNER";
  }

  return true;
}

function roleRank(role: string) {
  switch (role) {
    case "OWNER":
      return 4;
    case "ADMIN":
      return 3;
    case "MODERATOR":
      return 2;
    default:
      return 1;
  }
}

function serializeUser(user: any) {
  const data =
    typeof user.toObject === "function"
      ? user.toObject()
      : user;

  const {
    _id,
    passwordHash,
    ...safeUser
  } = data;

  return {
    ...safeUser,
    id: _id?.toString(),
  };
}

export class UsersService {
  async listForAdministration() {
    const users = await User.find({
      status: { $ne: "DELETED" },
    })
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .lean();

    return users.map(serializeUser);
  }

  async get(id: string) {
    const user = await User.findOne({
      _id: id,
      status: { $ne: "DELETED" },
    })
      .select("-passwordHash")
      .lean();

    if (!user) {
      throw new Error("Membre introuvable.");
    }

    return serializeUser(user);
  }

  async create(
    input: CreateMemberInput,
    actorRole: ActorRole
  ) {
    const email = input.email.trim().toLowerCase();
    const username = input.username.trim();
    const displayName = input.displayName?.trim() || undefined;
    const role = input.role ?? UserRole.PLAYER;

    if (!email || !email.includes("@")) {
      throw new Error("Une adresse email valide est obligatoire.");
    }

    if (username.length < 2 || username.length > 32) {
      throw new Error("L'identifiant doit contenir entre 2 et 32 caractères.");
    }

    if (!canManageRole(actorRole, role)) {
      throw new Error("Vous ne pouvez pas attribuer ce rôle.");
    }

    const existing = await User.findOne({
      $or: [{ email }, { "profile.username": username }],
    });

    if (existing) {
      throw new Error(
        existing.email === email
          ? "Cette adresse email est déjà utilisée."
          : "Cet identifiant est déjà utilisé."
      );
    }

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);

    const discordId = input.discordId?.trim() || undefined;
    const discordUsername = input.discordUsername?.trim() || undefined;

    const user = await User.create({
      email,
      passwordHash,
      role,
      status: "ACTIVE",
      mustChangePassword: true,
      profile: {
        username,
        displayName,
        avatar: input.avatar?.trim() || undefined,
      },
      discord: {
        linked: Boolean(discordId),
        discordId,
        username: discordUsername,
      },
      paxDei: {},
      economy: {
        balances: new Map(),
      },
    });

    if (discordId) {
      try {
        await linkDiscord({
          memberId: user._id.toString(),
          discordId,
          discordUsername,
        });
      } catch (error) {
        await User.deleteOne({ _id: user._id });
        throw error;
      }
    }

    // Inscription automatique dans l'arbre du Clan.
    await clanRepository.upsert(user._id.toString(), {
      memberId: user._id.toString(),
      role: "INITIE",
      parentId: null,
      portrait: input.avatar?.trim() || null,
      displayOrder: 0,
      active: true,
    });

    const safeUser = user.toObject() as unknown as Record<string, unknown>;
    delete safeUser.passwordHash;

    return serializeUser(user);
  }

  async update(
    id: string,
    input: UpdateMemberInput,
    actorId: string,
    actorRole: ActorRole
  ) {
    const user = await User.findById(id);

    if (!user) {
      throw new Error("Membre introuvable.");
    }

    if (user._id.toString() === actorId && input.role && input.role !== user.role) {
      throw new Error("Vous ne pouvez pas modifier votre propre rôle.");
    }

    if (user.role === UserRole.OWNER && actorRole !== "OWNER") {
      throw new Error("Seul le propriétaire peut modifier ce compte.");
    }

    const nextRole = input.role ?? user.role;

    if (roleRank(actorRole) <= roleRank(user.role) && actorId !== user._id.toString()) {
      if (roleRank(nextRole) > roleRank(actorRole)) {
        throw new Error("Vous ne pouvez pas attribuer un rôle supérieur au vôtre.");
      }
    }

    if (!canManageRole(actorRole, nextRole)) {
      throw new Error("Vous ne pouvez pas attribuer ce rôle.");
    }

    if (input.email !== undefined) {
      const email = input.email.trim().toLowerCase();

      if (!email || !email.includes("@")) {
        throw new Error("Une adresse email valide est obligatoire.");
      }

      const duplicate = await User.findOne({
        email,
        _id: { $ne: user._id },
      });

      if (duplicate) {
        throw new Error("Cette adresse email est déjà utilisée.");
      }

      user.email = email;
    }

    if (input.username !== undefined) {
      const username = input.username.trim();

      if (username.length < 2 || username.length > 32) {
        throw new Error("L'identifiant doit contenir entre 2 et 32 caractères.");
      }

      const duplicate = await User.findOne({
        "profile.username": username,
        _id: { $ne: user._id },
      });

      if (duplicate) {
        throw new Error("Cet identifiant est déjà utilisé.");
      }

      user.profile.username = username;
    }

    if (input.displayName !== undefined) {
      user.profile.displayName =
        input.displayName.trim() || undefined;
    }

    if (input.avatar !== undefined) {
      user.profile.avatar =
        input.avatar.trim() || undefined;
    }

    if (input.role !== undefined) {
      user.role = input.role;
    }

    const discordId =
      input.discordId !== undefined
        ? input.discordId.trim() || undefined
        : user.discord?.discordId;

    const discordUsername =
      input.discordUsername !== undefined
        ? input.discordUsername.trim() || undefined
        : user.discord?.username;

    if (input.discordId !== undefined || input.discordUsername !== undefined) {
      if (discordId) {
        await linkDiscord({
          memberId: user._id.toString(),
          discordId,
          discordUsername,
        });

        user.discord = {
          ...(user.discord ?? {}),
          linked: true,
          discordId,
          username: discordUsername,
        };
      } else {
        await unlinkDiscord(user._id.toString());

        user.discord = {
          ...(user.discord ?? {}),
          linked: false,
          discordId: undefined,
          username: undefined,
        };
      }
    }

    await user.save();

    const safeUser = user.toObject() as unknown as Record<string, unknown>
    delete safeUser.passwordHash;

    return safeUser;
  }

  async resetPassword(id: string, actorId: string, actorRole: ActorRole) {
    const user = await User.findById(id);

    if (!user) {
      throw new Error("Membre introuvable.");
    }

    if (user._id.toString() === actorId) {
      throw new Error(
        "Utilisez la fonction de changement de mot de passe pour votre propre compte."
      );
    }

    if (user.role === UserRole.OWNER && actorRole !== "OWNER") {
      throw new Error("Seul le propriétaire peut réinitialiser ce compte.");
    }

    if (roleRank(user.role) >= roleRank(actorRole)) {
      throw new Error(
        "Vous ne pouvez pas réinitialiser le mot de passe d'un membre de rang égal ou supérieur."
      );
    }

    const temporaryPassword = generateTemporaryPassword();
    user.passwordHash = await bcrypt.hash(temporaryPassword, 12);
    user.mustChangePassword = true;

    await user.save();

    return { temporaryPassword };
  }

  async suspend(id: string, actorId: string, actorRole: ActorRole) {
    const user = await User.findById(id);

    if (!user) {
      throw new Error("Membre introuvable.");
    }

    if (user._id.toString() === actorId) {
      throw new Error("Vous ne pouvez pas suspendre votre propre compte.");
    }

    if (user.role === UserRole.OWNER && actorRole !== "OWNER") {
      throw new Error("Seul le propriétaire peut suspendre ce compte.");
    }

    if (roleRank(user.role) >= roleRank(actorRole)) {
      throw new Error(
        "Vous ne pouvez pas suspendre un membre de rang égal ou supérieur."
      );
    }

    user.status = "SUSPENDED";
    await user.save();

    return this.get(id);
  }

  async reactivate(id: string, actorId: string, actorRole: ActorRole) {
    const user = await User.findById(id);

    if (!user) {
      throw new Error("Membre introuvable.");
    }

    if (user.role === UserRole.OWNER && actorRole !== "OWNER") {
      throw new Error("Seul le propriétaire peut réactiver ce compte.");
    }

    if (roleRank(user.role) >= roleRank(actorRole) && actorId !== user._id.toString()) {
      throw new Error(
        "Vous ne pouvez pas réactiver un membre de rang égal ou supérieur."
      );
    }

    user.status = "ACTIVE";
    await user.save();

    return this.get(id);
  }

  /**
   * Suppression logique.
   * Le document reste en base avec status=DELETED.
   * Il disparaît de l'annuaire et le compte ne peut plus ouvrir de session.
   */
  async archive(id: string, actorId: string, actorRole: ActorRole) {
    const user = await User.findById(id);

    if (!user) {
      throw new Error("Membre introuvable.");
    }

    if (user._id.toString() === actorId) {
      throw new Error("Vous ne pouvez pas archiver votre propre compte.");
    }

    if (user.role === UserRole.OWNER && actorRole !== "OWNER") {
      throw new Error("Seul le propriétaire peut archiver ce compte.");
    }

    if (roleRank(user.role) >= roleRank(actorRole)) {
      throw new Error(
        "Vous ne pouvez pas archiver un membre de rang égal ou supérieur."
      );
    }

    user.status = "DELETED";
    await user.save();

    await clanRepository.upsert(user._id.toString(), {
      memberId: user._id.toString(),
      active: false,
    });

    return { id: user._id.toString(), status: user.status };
  }

  async restore(id: string, actorId: string, actorRole: ActorRole) {
    const user = await User.findById(id);

    if (!user) {
      throw new Error("Membre introuvable.");
    }

    if (user.role === UserRole.OWNER && actorRole !== "OWNER") {
      throw new Error("Seul le propriétaire peut restaurer ce compte.");
    }

    if (roleRank(user.role) >= roleRank(actorRole) && actorId !== user._id.toString()) {
      throw new Error(
        "Vous ne pouvez pas restaurer un membre de rang égal ou supérieur."
      );
    }

    user.status = "ACTIVE";
    await user.save();

    await clanRepository.upsert(user._id.toString(), {
      memberId: user._id.toString(),
      role: "INITIE",
      active: true,
      portrait: user.profile?.avatar ?? null,
    });

    return {
      id: user._id.toString(),
      status: user.status,
    };
  }
}

export const usersService = new UsersService();