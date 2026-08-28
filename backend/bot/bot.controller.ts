import type { Request, Response } from "express";
import { botService } from "./bot.service";
import { economyService } from "../economy/economy.service";
import type { BotMemberSyncInput } from "./bot.types";
import type { VoiceRewardMemberInput } from "../economy/economy.types";

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
        currencyCode: result.currencyCode,
        currencySymbol: result.currencySymbol,
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
    const rawMembers = Array.isArray(req.body?.members) ? req.body.members : null;

    if (!guildId || !rawMembers) {
      return res.status(400).json({
        success: false,
        message: "guildId et members sont requis.",
      });
    }

    const members: VoiceRewardMemberInput[] = rawMembers
      .filter((member: unknown) => member && typeof member === "object")
      .map((member: Record<string, unknown>) => ({
        discordId: String(member.discordId ?? "").trim(),
        channelId: String(member.channelId ?? "").trim(),
        selfMute: Boolean(member.selfMute),
        selfDeaf: Boolean(member.selfDeaf),
        serverMute: Boolean(member.serverMute),
        serverDeaf: Boolean(member.serverDeaf),
        alone: Boolean(member.alone),
        afk: Boolean(member.afk),
      }));

    const result = await economyService.rewardVoiceTick(guildId, members);

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Erreur récompense présence vocale Discord :", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de traiter les récompenses vocales.",
    });
  }
}
