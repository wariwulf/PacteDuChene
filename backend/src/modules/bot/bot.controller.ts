import type { Request, Response } from "express";
import { botService } from "./bot.service";
import { economyService } from "../economy/economy.service";
import type { BotMemberSyncInput } from "./bot.types";

export async function getBotHealth(_req: Request, res: Response) {
  return res.status(200).json({ success: true, service: "pacte-discord-bot-api" });
}

export async function getMemberByDiscordId(req: Request, res: Response) {
  try {
    const member = await botService.findMemberByDiscordId(String(req.params.discordId ?? ""));
    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Aucun compte Pacte actif ou suspendu n'est lié à ce compte Discord.",
      });
    }
    return res.status(200).json({ success: true, data: member });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Impossible de résoudre le membre Discord.",
    });
  }
}

export async function syncDiscordMember(req: Request, res: Response) {
  try {
    const body = (req.body ?? {}) as Partial<BotMemberSyncInput>;
    const result = await botService.syncMember({
      discordId: String(body.discordId ?? ""),
      username: body.username === undefined ? undefined : String(body.username),
      displayName: body.displayName === undefined ? undefined : String(body.displayName),
      avatarUrl: body.avatarUrl === undefined ? undefined : String(body.avatarUrl),
      clanRole: body.clanRole === undefined ? null : body.clanRole,
    });

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Impossible de synchroniser le membre Discord.",
    });
  }
}


/**
 * Retourne les soldes économiques d'un membre à partir de son identifiant Discord.
 *
 * Le bot utilise l'identifiant Discord, tandis que le module économie travaille
 * avec le memberId Pacte. On résout donc d'abord le membre lié.
 */
export async function getBotBalances(req: Request, res: Response) {
  try {
    const discordId = String(req.params.discordId ?? "").trim();

    if (!discordId) {
      return res.status(400).json({
        success: false,
        message: "discordId est requis.",
      });
    }

    const member = await botService.findMemberByDiscordId(discordId);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Aucun compte Pacte actif ou suspendu n'est lié à ce compte Discord.",
      });
    }

    const balances = await economyService.getBalances(member.memberId);

    // Même contrat que l'API économie classique :
    // data contient un objet avec la propriété balances.
    return res.status(200).json({
      success: true,
      data: { balances },
    });
  } catch (error) {
    console.error("Erreur récupération soldes Discord :", error);

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de récupérer les soldes économiques.",
    });
  }
}

export async function completeDiscordMembersSync(req: Request, res: Response) {
  try {
    const seenDiscordIds = Array.isArray(req.body?.seenDiscordIds)
      ? req.body.seenDiscordIds.map((id: unknown) => String(id))
      : null;

    if (!seenDiscordIds) {
      return res.status(400).json({ success: false, message: "seenDiscordIds doit être un tableau." });
    }

    const result = await botService.completeFullSync(seenDiscordIds);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Impossible de finaliser la synchronisation.",
    });
  }
}


export async function claimDailyReward(req: Request, res: Response) {
  try {
    const discordId = String(req.body?.discordId ?? "").trim();

    if (!discordId) {
      return res.status(400).json({
        success: false,
        message: "discordId est requis.",
      });
    }

    const member = await botService.findMemberByDiscordId(discordId);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Aucun compte Pacte actif ou suspendu n'est lié à ce compte Discord.",
      });
    }

    const result = await economyService.claimDailyReward(member.memberId);

    return res.status(200).json({
      success: true,
      data: {
        granted: result.granted,
        amount: result.amount,
        currencyId: result.currencyId,
        currencyImage: result.currencyImage,
        newBalance: result.newBalance,
        message: result.message,
      },
    });
  } catch (error) {
    console.error("Erreur récompense quotidienne Discord :", error);

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible d'attribuer la récompense quotidienne.",
    });
  }
}


export async function rewardVoiceTick(req: Request, res: Response) {
  try {
    const guildId = String(req.body?.guildId ?? "").trim();

    const members = Array.isArray(req.body?.members)
      ? req.body.members
          .map((member: unknown) => {
            if (!member || typeof member !== "object") {
              return null;
            }

            const value = member as Record<string, unknown>;

            return {
              discordId: String(value.discordId ?? "").trim(),
              channelId:
                value.channelId === undefined ||
                value.channelId === null
                  ? null
                  : String(value.channelId),
            };
          })
          .filter(
            (
              member: {
                discordId: string;
                channelId: string | null;
              } | null
            ): member is {
              discordId: string;
              channelId: string | null;
            } => Boolean(member?.discordId)
          )
      : null;

    if (!guildId) {
      return res.status(400).json({
        success: false,
        message: "guildId est requis.",
      });
    }

    if (!members) {
      return res.status(400).json({
        success: false,
        message: "members doit être un tableau.",
      });
    }

    const result = await economyService.rewardVoiceTick(
      guildId,
      members
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "Erreur récompenses vocales Discord :",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de traiter les récompenses vocales.",
    });
  }
}
