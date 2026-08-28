import { EconomyRepository } from "./economy.repository";
import {
  CURRENCY_IDS,
  isCurrencyId,
  type CurrencyId,
} from "./economy.constants";
import type { EconomyBalances } from "./economy.types";
import { economyTransactionRepository } from "./economy-transaction.repository";
import { economyVoiceSessionRepository } from "./economy-voice-session.repository";

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

function assertCurrency(
  currencyId: string
): asserts currencyId is CurrencyId {
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

  /**
   * Récupérer les soldes d'un utilisateur.
   */
  async getBalances(
    userId: string
  ): Promise<EconomyBalances> {
    const user =
      await this.economyRepository.findUserById(userId);

    if (!user) {
      throw new Error("Utilisateur introuvable.");
    }

    return normalizeBalances(user.economy?.balances);
  }

  /**
   * Récupérer l'historique économique d'un utilisateur.
   */
  async getHistory(
    userId: string,
    limit = 50
  ) {
    return this.economyRepository.findByUserId(
      userId,
      limit
    );
  }

  /**
   * Enregistrer une transaction économique.
   */
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

  /**
   * Ajouter une monnaie au solde d'un utilisateur.
   */
  async addBalance(
    userId: string,
    currencyId: string,
    amount: number
  ): Promise<EconomyBalances> {
    assertCurrency(currencyId);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error(
        "Le montant doit être supérieur à 0."
      );
    }

    const user =
      await this.economyRepository.updateUserBalance(
        userId,
        currencyId,
        amount
      );

    if (!user) {
      throw new Error("Utilisateur introuvable.");
    }

    return normalizeBalances(user.economy?.balances);
  }

  /**
   * Retirer une monnaie du solde d'un utilisateur.
   */
  async removeBalance(
    userId: string,
    currencyId: string,
    amount: number
  ): Promise<EconomyBalances> {
    assertCurrency(currencyId);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error(
        "Le montant doit être supérieur à 0."
      );
    }

    const user =
      await this.economyRepository.findUserById(userId);

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

    return normalizeBalances(
      updatedUser.economy?.balances
    );
  }

  /**
   * Récompense quotidienne Discord.
   *
   * Une seule récompense est possible par jour calendaire UTC
   * et par utilisateur.
   *
   * IMPORTANT :
   * Le service économique ne contient aucune icône de monnaie.
   * L'identifiant de la monnaie est retourné et la présentation
   * est gérée par la couche cliente.
   */
  async claimDailyReward(
    userId: string
  ): Promise<
    import("./economy.types").DailyRewardResult
  > {
    const amount = 100;
    const currencyId: CurrencyId = "bronze";
    const source = "discord";
    const sourceId = new Date()
      .toISOString()
      .slice(0, 10);

    const user =
      await this.economyRepository.findUserById(userId);

    if (!user) {
      throw new Error("Utilisateur introuvable.");
    }

    const existing =
      await economyTransactionRepository.findDailyReward(
        userId,
        sourceId,
        currencyId
      );

    /**
     * La récompense a déjà été réclamée aujourd'hui.
     */
    if (existing) {
      const balances =
        await this.getBalances(userId);

      return {
        granted: false,
        amount,
        currencyId,
        currencyImage: "/images/economy/currency-bronze.png",
        newBalance: balances.bronze, 
        message:
          "⏳ Tu as déjà récupéré ta récompense journalière aujourd'hui.",
      };
    }

    /**
     * Réservation de la récompense.
     *
     * L'index unique protège contre deux appels simultanés.
     */
    let reservation;

    try {
      reservation =
        await this.addTransaction({
          userId,
          currencyId,
          amount,
          type: "daily_reward",
          source,
          sourceId,
          description:
            "Récompense quotidienne Discord",
        });
    } catch (error: any) {
      /**
       * Une autre requête a déjà réservé la récompense.
       */
      if (error?.code === 11000) {
        const balances =
          await this.getBalances(userId);

        return {
          granted: false,
          amount,
          currencyId,
          currencyImage: "/images/economy/currency-bronze.png",
          newBalance: balances.bronze,
          message:
            "⏳ Tu as déjà récupéré ta récompense journalière aujourd'hui.",
        };
      }

      throw error;
    }

    /**
     * Crédit effectif.
     */
    try {
      const balances =
        await this.addBalance(
          userId,
          currencyId,
          amount
        );

      return {
        granted: true,
        amount,
        currencyId,
        currencyImage: "/images/economy/currency-bronze.png",
        newBalance: balances.bronze,
        message:
          "Récompense quotidienne accordée.",
      };
    } catch (error) {
      /**
       * Le crédit ayant échoué, on libère la réservation
       * afin que la récompense puisse être retentée.
       */
      await economyTransactionRepository.deleteById(
        reservation._id.toString()
      );

      throw error;
    }
  }

  /**
   * Récompenses de présence vocale Discord.
   *
   * Règle actuelle :
   * - 30 minutes de présence observée = 10 Bronze
   * - plusieurs intervalles peuvent être crédités lors d'un tick
   * - le même intervalle ne peut pas être crédité deux fois
   *
   * Le bot transmet uniquement les membres actuellement présents.
   * Le backend reste responsable du calcul et du crédit.
   */
  async rewardVoiceTick(
    guildId: string,
    members: Array<{
      discordId: string;
      channelId?: string | null;
    }>
  ): Promise<{
    rewardedUsers: number;
    bronzeGranted: number;
  }> {
    const now = new Date();
    const intervalSeconds = 30 * 60;
    const rewardAmount = 10;

    const normalizedMembers = members
      .map((member) => ({
        discordId: String(member.discordId ?? "").trim(),
        channelId:
          member.channelId === undefined || member.channelId === null
            ? null
            : String(member.channelId),
      }))
      .filter((member) => member.discordId.length > 0);

    await economyVoiceSessionRepository.deactivateMissing(
      guildId,
      normalizedMembers.map((member) => member.discordId)
    );

    let rewardedUsers = 0;
    let bronzeGranted = 0;

    for (const member of normalizedMembers) {
      const botMember = await this.resolveVoiceMember(
        member.discordId
      );

      if (!botMember) {
        continue;
      }

      let session =
        await economyVoiceSessionRepository.find(
          guildId,
          member.discordId
        );

      if (!session) {
        session = await economyVoiceSessionRepository.create({
          guildId,
          discordId: member.discordId,
          userId: botMember.memberId,
          channelId: member.channelId,
          startedAt: now,
          lastSeenAt: now,
        });

        continue;
      }

      // Si la session appartenait à un ancien compte, on repart proprement.
      if (session.userId !== botMember.memberId) {
        session.userId = botMember.memberId;
        session.startedAt = now;
        session.lastSeenAt = now;
        session.accumulatedSeconds = 0;
        session.rewardedIntervals = 0;
        session.channelId = member.channelId;
        session.active = true;
        await economyVoiceSessionRepository.save(session);
        continue;
      }

      /*
       * Le bot poll actuellement à intervalles réguliers.
       * On ne comptabilise pas une longue coupure du bot/backend comme
       * de la présence vocale réelle : le delta est donc plafonné à 2 minutes.
       */
      const elapsedSeconds = Math.max(
        0,
        Math.min(
          (now.getTime() - session.lastSeenAt.getTime()) / 1000,
          120
        )
      );

      session.accumulatedSeconds += elapsedSeconds;
      session.lastSeenAt = now;
      session.channelId = member.channelId;
      session.active = true;

      const earnedIntervals = Math.floor(
        session.accumulatedSeconds / intervalSeconds
      );

      for (
        let interval = session.rewardedIntervals + 1;
        interval <= earnedIntervals;
        interval += 1
      ) {
        const sourceId =
          `voice:${guildId}:${member.discordId}:${session.startedAt.getTime()}:${interval}`;

        try {
          await this.addTransaction({
            userId: botMember.memberId,
            currencyId: "bronze",
            amount: rewardAmount,
            type: "voice_reward",
            source: "discord_voice",
            sourceId,
            description:
              "Récompense de présence en vocal Discord (30 minutes)",
          });
        } catch (error: any) {
          // Une transaction déjà existante signifie que cet intervalle
          // a déjà été réservé/crédité.
          if (error?.code === 11000) {
            session.rewardedIntervals = interval;
            continue;
          }

          throw error;
        }

        try {
          await this.addBalance(
            botMember.memberId,
            "bronze",
            rewardAmount
          );

          session.rewardedIntervals = interval;
          rewardedUsers += 1;
          bronzeGranted += rewardAmount;
        } catch (error) {
          // On libère la transaction de réservation afin de permettre
          // une nouvelle tentative au prochain tick.
          const transaction = await economyTransactionRepository.findBySourceId(
            sourceId
          );

          if (transaction?._id) {
            await economyTransactionRepository.deleteById(
              transaction._id.toString()
            );
          }

          throw error;
        }
      }

      session.rewardedIntervals = Math.max(
        session.rewardedIntervals,
        earnedIntervals
      );

      await economyVoiceSessionRepository.save(session);
    }

    return {
      rewardedUsers,
      bronzeGranted,
    };
  }

  /**
   * Résout un compte Pacte à partir de son identifiant Discord.
   * On réutilise le même mécanisme que le bot controller pour garantir
   * qu'un membre non lié ne reçoit jamais de monnaie.
   */
  private async resolveVoiceMember(
    discordId: string
  ): Promise<{ memberId: string } | null> {
    const { findByDiscordId } = await import(
      "../discord/discord.repository"
    );

    const link = await findByDiscordId(discordId);
    if (!link) {
      return null;
    }

    const user =
      await this.economyRepository.findUserById(
        link.memberId
      );

    if (!user || user.status === "DELETED") {
      return null;
    }

    return {
      memberId: user._id.toString(),
    };
  }

  /**
   * Ajouter une récompense liée à une quête ou un exploit.
   */
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
      throw new Error(
        "Le montant doit être supérieur à 0."
      );
    }

    /**
     * Vérification d'idempotence.
     */
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

    /**
     * Crédit.
     */
    const balances =
      await this.addBalance(
        userId,
        currencyId,
        amount
      );

    /**
     * Historique.
     */
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
      /**
       * Si MongoDB indique que l'index unique est violé,
       * une autre tentative a déjà enregistré cette récompense.
       */
      if (error?.code === 11000) {
        return this.getBalances(userId);
      }

      throw error;
    }

    return balances;
  }
}

export const economyService =
  new EconomyService();