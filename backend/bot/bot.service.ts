import { findAllLinks, findByDiscordId } from "../discord/discord.repository";
import { linkDiscord } from "../discord/discord.service";
import { clanRepository } from "../clan/clan.repository";
import type { ClanRole } from "../clan/clan.types";
import { UserRole } from "../../common/constants/roles";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { UserRepository } from "../users/user.repository";
import { User } from "../users/user.model";
import type {
  BotMemberDto,
  BotMemberSyncInput,
  BotMemberSyncResult,
} from "./bot.types";

const CLAN_ROLES: readonly ClanRole[] = [
  "REX",
  "DUX_FOEDERIS",
  "FRERE_JURE",
  "SOEUR_JUREE",
  "INITIE",
];

export class BotService {
  constructor(private readonly userRepository = new UserRepository()) {}

  /** DiscordLink est la référence pour la résolution inverse Discord -> Pacte. */
  async findMemberByDiscordId(discordId: string): Promise<BotMemberDto | null> {
    const normalizedDiscordId = discordId.trim();
    if (!normalizedDiscordId) throw new Error("discordId est requis.");

    const link = await findByDiscordId(normalizedDiscordId);
    if (!link) return null;

    const user = await this.userRepository.findById(link.memberId);
    // Un compte supprimé reste indiscernable d'un compte non lié.
    if (!user || user.status === "DELETED") return null;

    return {
      memberId: user._id.toString(),
      displayName: user.profile.displayName || user.profile.username,
      username: user.profile.username,
      role: user.role,
      status: user.status,
      discordId: link.discordId,
    };
  }

  /**
   * Synchronise un membre décrit par Discord sans accepter de memberId externe.
   * Le lien Discord reste toujours le point d'entrée de la résolution.
   */
  async syncMember(input: BotMemberSyncInput): Promise<BotMemberSyncResult> {
    const discordId = input.discordId.trim();
    if (!discordId) throw new Error("discordId est requis.");

    if (input.clanRole !== null && !CLAN_ROLES.includes(input.clanRole)) {
      throw new Error("Rôle de clan invalide.");
    }

    const link = await findByDiscordId(discordId);

    // Sans rôle de clan, on ne crée jamais de compte. Seul un lien existant
    // peut conduire à la suspension du compte historique.
    if (input.clanRole === null) {
      if (!link) return { action: "no_link", roleChanged: false };

      const user = await this.userRepository.findById(link.memberId);
      if (!user || user.status === "DELETED") {
        return { action: "ignored", roleChanged: false };
      }

      const clanMember = await clanRepository.findByMemberId(user._id.toString());
      const wasActive = user.status !== "SUSPENDED" || clanMember?.active !== false;

      user.status = "SUSPENDED";
      await user.save();
      await clanRepository.upsert(
        user._id.toString(),
        clanMember ? { active: false } : { role: "INITIE", active: false }
      );

      return {
        action: wasActive ? "deactivated" : "updated",
        memberId: user._id.toString(),
        roleChanged: false,
      };
    }

    const username = input.username?.trim();
    const displayName = input.displayName?.trim();
    if (!username || !displayName) {
      throw new Error("username et displayName sont requis pour un membre du clan.");
    }

    let user = link
      ? await this.userRepository.findById(link.memberId)
      : null;

    if (user?.status === "DELETED") {
      return { action: "ignored", roleChanged: false };
    }

    let created = false;
    if (!user) {
      // Ce mot de passe aléatoire n'est jamais exposé ni journalisé. Le compte
      // reste compatible avec l'authentification locale via mustChangePassword.
      const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 12);
      user = await User.create({
        email: `discord-${discordId}@discord.pacte.local`,
        passwordHash,
        role: UserRole.PLAYER,
        status: "ACTIVE",
        mustChangePassword: true,
        profile: {
          username: this.buildDiscordUsername(discordId),
          displayName,
          avatar: input.avatarUrl?.trim() || undefined,
        },
        discord: {
          linked: true,
          discordId,
          username,
          lastSyncAt: new Date(),
        },
        paxDei: {},
        economy: { balances: new Map() },
      });

      try {
        await linkDiscord({
          memberId: user._id.toString(),
          discordId,
          discordUsername: username,
        });
      } catch (error) {
        await User.deleteOne({ _id: user._id });
        throw error;
      }
      created = true;
    }

    const memberId = user._id.toString();
    const clanMember = await clanRepository.findByMemberId(memberId);
    const roleChanged = clanMember?.role !== input.clanRole;
    let userChanged = created;

    if (user.status !== "ACTIVE") {
      user.status = "ACTIVE";
      userChanged = true;
    }
    if (user.profile.displayName !== displayName) {
      user.profile.displayName = displayName;
      userChanged = true;
    }
    if (!user.profile.avatar && input.avatarUrl?.trim()) {
      user.profile.avatar = input.avatarUrl.trim();
      userChanged = true;
    }

    user.discord = {
      ...(user.discord ?? {}),
      linked: true,
      discordId,
      username,
      lastSyncAt: new Date(),
    };
    userChanged = true;
    await user.save();

    await linkDiscord({
      memberId,
      discordId,
      discordUsername: username,
    });

    // Un portrait de clan existant est considéré comme personnalisé et n'est
    // jamais remplacé par Discord. À la création, l'avatar Discord est utilisé.
    const portrait = clanMember?.portrait ?? user.profile.avatar ?? input.avatarUrl?.trim() ?? null;
    await clanRepository.upsert(memberId, {
      memberId,
      role: input.clanRole,
      active: true,
      portrait,
    });

    return {
      action: created ? "created" : userChanged || roleChanged ? "updated" : "updated",
      memberId,
      roleChanged,
    };
  }

  private buildDiscordUsername(discordId: string) {
    return `discord-${discordId}`.slice(0, 32);
  }

  /**
   * Le bot envoie l'inventaire complet du serveur Discord configuré. Les liens
   * absents de cet inventaire sont suspendus sans suppression de données.
   */
  async completeFullSync(seenDiscordIds: string[]) {
    const seen = new Set(seenDiscordIds.map((discordId) => discordId.trim()).filter(Boolean));
    const links = await findAllLinks();
    let deactivated = 0;

    for (const link of links) {
      if (seen.has(link.discordId)) continue;

      const user = await this.userRepository.findById(link.memberId);
      if (!user || user.status === "DELETED") continue;

      const clanMember = await clanRepository.findByMemberId(user._id.toString());
      const needsDeactivation = user.status !== "SUSPENDED" || clanMember?.active !== false;
      if (!needsDeactivation) continue;

      user.status = "SUSPENDED";
      await user.save();
      await clanRepository.upsert(
        user._id.toString(),
        clanMember ? { active: false } : { role: "INITIE", active: false }
      );
      deactivated += 1;
    }

    return { deactivated };
  }
}

export const botService = new BotService();
