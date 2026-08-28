"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBotHealth = getBotHealth;
exports.getMemberByDiscordId = getMemberByDiscordId;
exports.syncDiscordMember = syncDiscordMember;
exports.completeDiscordMembersSync = completeDiscordMembersSync;
exports.claimDailyReward = claimDailyReward;
exports.rewardVoiceTick = rewardVoiceTick;
const bot_service_1 = require("./bot.service");
const economy_service_1 = require("../economy/economy.service");
async function getBotHealth(_req, res) {
    return res.status(200).json({ success: true, service: "pacte-discord-bot-api" });
}
async function getMemberByDiscordId(req, res) {
    try {
        const member = await bot_service_1.botService.findMemberByDiscordId(String(req.params.discordId ?? ""));
        if (!member) {
            return res.status(404).json({
                success: false,
                message: "Aucun compte Pacte actif ou suspendu n'est lié à ce compte Discord.",
            });
        }
        return res.status(200).json({ success: true, data: member });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error instanceof Error ? error.message : "Impossible de résoudre le membre Discord.",
        });
    }
}
async function syncDiscordMember(req, res) {
    try {
        const body = (req.body ?? {});
        const result = await bot_service_1.botService.syncMember({
            discordId: String(body.discordId ?? ""),
            username: body.username === undefined ? undefined : String(body.username),
            displayName: body.displayName === undefined ? undefined : String(body.displayName),
            avatarUrl: body.avatarUrl === undefined ? undefined : String(body.avatarUrl),
            clanRole: body.clanRole === undefined ? null : body.clanRole,
        });
        return res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error instanceof Error ? error.message : "Impossible de synchroniser le membre Discord.",
        });
    }
}
async function completeDiscordMembersSync(req, res) {
    try {
        const seenDiscordIds = Array.isArray(req.body?.seenDiscordIds)
            ? req.body.seenDiscordIds.map((id) => String(id))
            : null;
        if (!seenDiscordIds) {
            return res.status(400).json({ success: false, message: "seenDiscordIds doit être un tableau." });
        }
        const result = await bot_service_1.botService.completeFullSync(seenDiscordIds);
        return res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: error instanceof Error ? error.message : "Impossible de finaliser la synchronisation.",
        });
    }
}
async function claimDailyReward(req, res) {
    try {
        const discordId = String(req.body?.discordId ?? "").trim();
        if (!discordId) {
            return res.status(400).json({
                success: false,
                message: "discordId est requis.",
            });
        }
        const member = await bot_service_1.botService.findMemberByDiscordId(discordId);
        if (!member) {
            return res.status(404).json({
                success: false,
                message: "Aucun compte Pacte actif ou suspendu n'est lié à ce compte Discord.",
            });
        }
        const result = await economy_service_1.economyService.claimDailyReward(member.memberId);
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
    }
    catch (error) {
        console.error("Erreur récompense quotidienne Discord :", error);
        return res.status(500).json({
            success: false,
            message: error instanceof Error
                ? error.message
                : "Impossible d'attribuer la récompense quotidienne.",
        });
    }
}
async function rewardVoiceTick(req, res) {
    try {
        const guildId = String(req.body?.guildId ?? "").trim();
        const rawMembers = Array.isArray(req.body?.members) ? req.body.members : null;
        if (!guildId || !rawMembers) {
            return res.status(400).json({
                success: false,
                message: "guildId et members sont requis.",
            });
        }
        const members = rawMembers
            .filter((member) => member && typeof member === "object")
            .map((member) => ({
            discordId: String(member.discordId ?? "").trim(),
            channelId: String(member.channelId ?? "").trim(),
            selfMute: Boolean(member.selfMute),
            selfDeaf: Boolean(member.selfDeaf),
            serverMute: Boolean(member.serverMute),
            serverDeaf: Boolean(member.serverDeaf),
            alone: Boolean(member.alone),
            afk: Boolean(member.afk),
        }));
        const result = await economy_service_1.economyService.rewardVoiceTick(guildId, members);
        return res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        console.error("Erreur récompense présence vocale Discord :", error);
        return res.status(500).json({
            success: false,
            message: error instanceof Error
                ? error.message
                : "Impossible de traiter les récompenses vocales.",
        });
    }
}
