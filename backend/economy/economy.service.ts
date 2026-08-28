import { EconomyRepository } from "./economy.repository";
import {
  CURRENCY_IDS,
  isCurrencyId,
  type CurrencyId,
} from "./economy.constants";
import type { EconomyBalances } from "./economy.types";
import { economyTransactionRepository } from "./economy-transaction.repository";
import { economyVoiceSessionRepository } from "./economy-voice-session.repository";
import { findByDiscordId } from "../discord/discord.repository";
import type { VoiceRewardMemberInput, VoiceRewardTickResult } from "./economy.types";

function readBalance(
  balances: unknown,
  currencyId: CurrencyId
): number {
  if (balances instanceof Map) {
    return Number(balances.get(currencyId) ?? 0);
  }

  if (
    balances &&
    typeof balances === "object" &&
    currencyId in balances
  ) {
    return Number(
      (balances as Record<string, unknown>)[currencyId] ?? 0
    );
  }

  return 0;
}

function normalizeBalances(
  balances: unknown
): EconomyBalances {
  return {
    solidus: readBalance(balances, "solidus"),
    argent: readBalance(balances, "argent"),
    bronze: readBalance(balances, "bronze"),
  };
}

function assertCurrency(currencyId: string): asserts currencyId is CurrencyId {
  if (!isCurrencyId(currencyId)) {
    throw new Error(
      `Monnaie invalide. Les monnaies disponibles sont : ${CURRENCY_IDS.join(", ")}.`
    );
  }
}

export class EconomyService {
  constructor(
    private readonly economyRepository = new EconomyRepository()
  ) {}

  async getBalances(userId: string): Promise<EconomyBalances> {
    const user = await this.economyRepository.findUserById(userId);

    if (!user) {
      throw new Error("Utilisateur introuvable.");
    }

    return normalizeBalances(user.economy?.balances);
  }

  async getHistory(userId: string, limit = 50) {
    return this.economyRepository.findByUserId(userId, limit);
  }

  async addTransaction(data: {
    userId: string;
    currencyId: string;
    amount: number;
    type:
      | "quest_reward"
      | "achievement_reward"
      | "purchase"
      | "admin_add"
      | "admin_remove"
      | "exchange"
      | "daily_reward"
      | "voice_reward"
      | "other";
    source?: string;
    sourceId?: string;
    description?: string;
  }) {
    assertCurrency(data.currencyId);

    return economyTransactionRepository.create({
      ...data,
      currencyId: data.currencyId,
    });
  }

  async addBalance(
    userId: string,
    currencyId: string,
    amount: number
  ): Promise<EconomyBalances> {
    assertCurrency(currencyId);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Le montant doit être supérieur à 0.");
    }

    const user = await this.economyRepository.updateUserBalance(
      userId,
      currencyId,
      amount
    );

    if (!user) {
      throw new Error("Utilisateur introuvable.");
    }

    return normalizeBalances(user.economy?.balances);
  }

  async removeBalance(
    userId: string,
    currencyId: string,
    amount: number
  ): Promise<EconomyBalances> {
    assertCurrency(currencyId);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Le montant doit être supérieur à 0.");
    }

    const user = await this.economyRepository.findUserById(userId);

    if (!user) {
      throw new Error("Utilisateur introuvable.");
    }

    const currentBalance = readBalance(
      user.economy?.balances,
      currencyId
    );

    if (currentBalance < amount) {
      throw new Error("Solde insuffisant.");
    }

    const updatedUser =
      await this.economyRepository.updateUserBalance(
        userId,
        currencyId,
        -amount
      );

    if (!updatedUser) {
      throw new Error("Utilisateur introuvable.");
    }

    return normalizeBalances(updatedUser.economy?.balances);
  }

  /**
   * Récompense quotidienne Discord.
   *
   * Une seule récompense est possible par jour calendaire UTC et par
   * utilisateur. La transaction de réservation est créée avant le crédit
   * afin que l'index unique protège contre deux requêtes concurrentes.
   */
  async claimDailyReward(userId: string): Promise<import("./economy.types").DailyRewardResult> {
    const amount = 100;
    const currencyId = "bronze" as const;
    const source = "discord";
    const sourceId = new Date().toISOString().slice(0, 10);

    const user = await this.economyRepository.findUserById(userId);
    if (!user) {
      throw new Error("Utilisateur introuvable.");
    }

    const existing = await economyTransactionRepository.findDailyReward(
      userId,
      sourceId,
      currencyId
    );

    if (existing) {
      const balances = await this.getBalances(userId);
      return {
        granted: false,
        amount,
        currencyId,
        currencyCode: "BRONZE",
        currencySymbol: "🥉",
        newBalance: balances.bronze,
        message: "⏳ Tu as déjà récupéré ta récompense journalière aujourd'hui.",
      };
    }

    let reservation;
    try {
      reservation = await this.addTransaction({
        userId,
        currencyId,
        amount,
        type: "daily_reward",
        source,
        sourceId,
        description: "Récompense quotidienne Discord",
      });
    } catch (error: any) {
      if (error?.code === 11000) {
        const balances = await this.getBalances(userId);
        return {
          granted: false,
          amount,
          currencyId,
          currencyCode: "BRONZE",
          currencySymbol: "🥉",
          newBalance: balances.bronze,
          message: "⏳ Tu as déjà récupéré ta récompense journalière aujourd'hui.",
        };
      }
      throw error;
    }

    try {
      const balances = await this.addBalance(userId, currencyId, amount);

      return {
        granted: true,
        amount,
        currencyId,
        currencyCode: "BRONZE",
        currencySymbol: "🥉",
        newBalance: balances.bronze,
        message: "Récompense quotidienne accordée.",
      };
    } catch (error) {
      await economyTransactionRepository.deleteById(reservation._id.toString());
      throw error;
    }
  }

  /**
   * Traite l'état vocal courant d'une guilde.
   *
   * Une session commence au premier tick où le membre est présent. Une
   * récompense de 10 Bronze est accordée toutes les 30 minutes réellement
   * écoulées pendant cette session. Les sessions sont persistées afin qu'un
   * redémarrage du bot ne remette pas le compteur à zéro.
   */
  async rewardVoiceTick(
    guildId: string,
    members: VoiceRewardMemberInput[]
  ): Promise<VoiceRewardTickResult> {
    const now = new Date();
    const activeDiscordIds = new Set(
      members.map((member) => String(member.discordId).trim()).filter(Boolean)
    );

    await economyVoiceSessionRepository.endMissing(
      guildId,
      activeDiscordIds,
      now
    );

    let processed = 0;
    let rewarded = 0;
    let bronzeGranted = 0;
    let skipped = 0;

    for (const member of members) {
      const discordId = String(member.discordId ?? "").trim();
      const channelId = String(member.channelId ?? "").trim();

      if (!discordId || !channelId || member.afk) {
        skipped += 1;
        continue;
      }

      const link = await this.findLinkedUser(discordId);
      if (!link) {
        skipped += 1;
        continue;
      }

      processed += 1;

      let session = await economyVoiceSessionRepository.findActive(
        guildId,
        discordId
      );

      if (!session) {
        session = await economyVoiceSessionRepository.create({
          userId: link.memberId,
          guildId,
          discordId,
          channelId,
          startedAt: now,
        });
        continue;
      }

      if (session.userId !== link.memberId) {
        session.active = false;
        session.endedAt = now;
        await session.save();
        session = await economyVoiceSessionRepository.create({
          userId: link.memberId,
          guildId,
          discordId,
          channelId,
          startedAt: now,
        });
        continue;
      }

      await economyVoiceSessionRepository.touch(session, channelId, now);

      const elapsedMs = now.getTime() - session.startedAt.getTime();
      const earnedIntervals = Math.floor(elapsedMs / (30 * 60 * 1000));

      if (earnedIntervals <= session.lastRewardedInterval) continue;

      for (
        let interval = session.lastRewardedInterval + 1;
        interval <= earnedIntervals;
        interval += 1
      ) {
        const sourceId = `voice:${guildId}:${discordId}:${session.startedAt.getTime()}:${interval}`;

        try {
          let reservation;
          try {
            reservation = await this.addTransaction({
              userId: link.memberId,
              currencyId: "bronze",
              amount: 10,
              type: "voice_reward",
              source: "discord_voice",
              sourceId,
              description: "Récompense de présence en vocal Discord (30 minutes)",
            });
          } catch (error: any) {
            if (error?.code === 11000) {
              session.lastRewardedInterval = interval;
              await session.save();
              continue;
            }
            throw error;
          }

          try {
            await this.addBalance(link.memberId, "bronze", 10);
            bronzeGranted += 10;
            rewarded += 1;
          } catch (error) {
            await economyTransactionRepository.deleteById(reservation._id.toString());
            throw error;
          }
        }

        session.lastRewardedInterval = earnedIntervals;
        await session.save();
      }
    }

    return { processed, rewarded, bronzeGranted, skipped };
  }

  private async findLinkedUser(discordId: string): Promise<{ memberId: string } | null> {
    const link = await findByDiscordId(discordId);
    if (!link) return null;

    const user = await this.economyRepository.findUserById(link.memberId);
    if (!user || user.status === "DELETED") return null;

    return { memberId: user._id.toString() };
  }

  async addReward(
    userId: string,
    currencyId: string,
    amount: number,
    type:
      | "quest_reward"
      | "achievement_reward",
    source: string,
    sourceId: string,
    description?: string
  ): Promise<EconomyBalances> {
    assertCurrency(currencyId);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Le montant doit être supérieur à 0.");
    }

    const existing =
      await this.economyRepository.findRewardTransaction(
        userId,
        type,
        source,
        sourceId,
        currencyId
      );

    if (existing) {
      return this.getBalances(userId);
    }

    const balances = await this.addBalance(
      userId,
      currencyId,
      amount
    );

    try {
      await this.addTransaction({
        userId,
        currencyId,
        amount,
        type,
        source,
        sourceId,
        description,
      });
    } catch (error: any) {
      if (error?.code === 11000) {
        return this.getBalances(userId);
      }

      throw error;
    }

    return balances;
  }
}

export const economyService = new EconomyService();
