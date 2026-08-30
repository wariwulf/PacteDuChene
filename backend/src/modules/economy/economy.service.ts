import { EconomyRepository } from "./economy.repository";
import {
  CURRENCY_IDS,
  isCurrencyId,
  type CurrencyId,
} from "./economy.constants";
import type { EconomyBalances } from "./economy.types";
import { economyTransactionRepository } from "./economy-transaction.repository";
import { EconomyVoiceSession } from "./economy-voice-session.model";
import { User } from "../users/user.model";

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

export interface VoiceRewardMember {
  discordId: string;
  channelId: string | null;
}

export interface VoiceRewardResult {
  rewardedUsers: number;
  bronzeGranted: number;
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
   *
   * L'historique est stocké dans EconomyTransaction.
   */
  async getHistory(
    userId: string,
    limit = 50
  ) {
    return economyTransactionRepository.findByUserId(
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

    if (existing) {
      const balances =
        await this.getBalances(userId);

      return {
        granted: false,
        amount,
        currencyId,
        currencyImage:
          "/images/economy/currency-bronze.png",
        newBalance: balances.bronze,
        message:
          "⏳ Tu as déjà récupéré ta récompense journalière aujourd'hui.",
      };
    }

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
      if (error?.code === 11000) {
        const balances =
          await this.getBalances(userId);

        return {
          granted: false,
          amount,
          currencyId,
          currencyImage:
            "/images/economy/currency-bronze.png",
          newBalance: balances.bronze,
          message:
            "⏳ Tu as déjà récupéré ta récompense journalière aujourd'hui.",
        };
      }

      throw error;
    }

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
        currencyImage:
          "/images/economy/currency-bronze.png",
        newBalance: balances.bronze,
        message:
          "Récompense quotidienne accordée.",
      };
    } catch (error) {
      await economyTransactionRepository.deleteById(
        reservation._id.toString()
      );

      throw error;
    }
  }

  /**
   * Récompense de présence vocale Discord.
   *
   * 30 minutes cumulées en vocal = 10 Bronze.
   *
   * Le temps est conservé dans EconomyVoiceSession.
   * Les différentes sessions vocales d'un même membre
   * peuvent donc continuer à alimenter le compteur.
   */
  async rewardVoiceTick(
    guildId: string,
    members: VoiceRewardMember[]
  ): Promise<VoiceRewardResult> {
    const VOICE_INTERVAL_SECONDS = 30 * 60;
    const VOICE_REWARD_BRONZE = 10;

    const now = new Date();

    let rewardedUsers = 0;
    let bronzeGranted = 0;

    const activeDiscordIds = new Set<string>();

    for (const member of members) {
      const discordId = String(
        member.discordId ?? ""
      ).trim();

      if (!discordId) {
        continue;
      }

      activeDiscordIds.add(discordId);

      /*
       * Recherche du compte Pacte lié au compte Discord.
       *
       * Le modèle User contient discord.discordId et
       * l'identifiant Mongo du membre est utilisé comme userId
       * dans EconomyVoiceSession.
       */
      const user = await User.findOne({
        "discord.discordId": discordId,
        status: { $ne: "DELETED" },
      });

      /*
       * Un joueur Discord qui n'a pas encore de compte Pacte
       * ne peut pas recevoir de monnaie.
       */
      if (!user) {
        continue;
      }

      const userId = user._id.toString();

      let session =
        await EconomyVoiceSession.findOne({
          guildId,
          discordId,
        });

      /*
       * Première détection du membre.
       */
      if (!session) {
        session =
          await EconomyVoiceSession.create({
            guildId,
            discordId,
            userId,
            channelId: member.channelId ?? null,
            startedAt: now,
            lastSeenAt: now,
            accumulatedSeconds: 0,
            rewardedIntervals: 0,
            active: true,
          });

        continue;
      }

      /*
       * Le compte Discord peut avoir été relié à un autre
       * compte Pacte depuis la dernière session.
       */
      if (session.userId !== userId) {
        session.userId = userId;
      }

      /*
       * Calcul du temps écoulé depuis le dernier tick.
       *
       * Le bot effectue normalement un tick toutes les 60 secondes.
       * On limite néanmoins le delta à 2 minutes afin d'éviter
       * qu'un arrêt prolongé du bot ne transforme une absence
       * en plusieurs heures de présence fictive.
       */
      const elapsedMilliseconds =
        now.getTime() -
        session.lastSeenAt.getTime();

      const elapsedSeconds = Math.max(
        0,
        Math.min(
          Math.floor(elapsedMilliseconds / 1000),
          120
        )
      );

      session.accumulatedSeconds +=
        elapsedSeconds;

      session.lastSeenAt = now;
      session.channelId =
        member.channelId ?? null;
      session.active = true;

      /*
       * Nombre total de paliers de 30 minutes atteints.
       */
      const totalIntervals = Math.floor(
        session.accumulatedSeconds /
          VOICE_INTERVAL_SECONDS
      );

      /*
       * Nombre de récompenses qu'il reste à attribuer.
       */
      const intervalsToReward =
        totalIntervals -
        session.rewardedIntervals;

      if (intervalsToReward <= 0) {
        await session.save();
        continue;
      }

      /*
       * Plusieurs paliers peuvent théoriquement être atteints
       * entre deux ticks. On les traite tous.
       */
      let successfullyRewarded = 0;

      for (
        let interval = 0;
        interval < intervalsToReward;
        interval++
      ) {
        try {
          await this.addBalance(
            userId,
            "bronze",
            VOICE_REWARD_BRONZE
          );

          /*
           * Les récompenses vocales apparaissent dans
           * l'historique économique comme transactions Discord.
           */
          await this.addTransaction({
            userId,
            currencyId: "bronze",
            amount: VOICE_REWARD_BRONZE,
            type: "other",
            source: "discord_voice",
            sourceId:
              `${guildId}:${discordId}:${session.rewardedIntervals + 1 + successfullyRewarded}`,
            description:
              "Récompense de présence en vocal Discord",
          });

          successfullyRewarded++;
        } catch (error) {
          console.error(
            `Impossible d'attribuer la récompense vocale à ${discordId}:`,
            error
          );

          break;
        }
      }

      if (successfullyRewarded > 0) {
        session.rewardedIntervals +=
          successfullyRewarded;

        rewardedUsers++;
        bronzeGranted +=
          successfullyRewarded *
          VOICE_REWARD_BRONZE;
      }

      await session.save();
    }

    /*
     * Les sessions qui ne sont plus présentes dans le tick
     * sont simplement marquées inactives.
     *
     * On conserve leur temps cumulé : lorsqu'un membre revient
     * en vocal, sa session peut reprendre son compteur.
     */
    await EconomyVoiceSession.updateMany(
      {
        guildId,
        active: true,
        discordId: {
          $nin: Array.from(activeDiscordIds),
        },
      },
      {
        $set: {
          active: false,
          channelId: null,
        },
      }
    );

    return {
      rewardedUsers,
      bronzeGranted,
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

    const balances =
      await this.addBalance(
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

export const economyService =
  new EconomyService();