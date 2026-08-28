"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.botService = exports.BotService = void 0;
const discord_repository_1 = require("../discord/discord.repository");
const discord_service_1 = require("../discord/discord.service");
const clan_repository_1 = require("../clan/clan.repository");
const roles_1 = require("../../common/constants/roles");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const user_repository_1 = require("../users/user.repository");
const user_model_1 = require("../users/user.model");
const CLAN_ROLES = [
    "REX",
    "DUX_FOEDERIS",
    "FRERE_JURE",
    "SOEUR_JUREE",
    "INITIE",
];
class BotService {
    userRepository;
    constructor(userRepository = new user_repository_1.UserRepository()) {
        this.userRepository = userRepository;
    }
    /** DiscordLink est la référence pour la résolution inverse Discord -> Pacte. */
    async findMemberByDiscordId(discordId) {
        const normalizedDiscordId = discordId.trim();
        if (!normalizedDiscordId)
            throw new Error("discordId est requis.");
        const link = await (0, discord_repository_1.findByDiscordId)(normalizedDiscordId);
        if (!link)
            return null;
        const user = await this.userRepository.findById(link.memberId);
        // Un compte supprimé reste indiscernable d'un compte non lié.
        if (!user || user.status === "DELETED")
            return null;
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
    async syncMember(input) {
        const discordId = input.discordId.trim();
        if (!discordId)
            throw new Error("discordId est requis.");
        if (input.clanRole !== null && !CLAN_ROLES.includes(input.clanRole)) {
            throw new Error("Rôle de clan invalide.");
        }
        const link = await (0, discord_repository_1.findByDiscordId)(discordId);
        // Sans rôle de clan, on ne crée jamais de compte. Seul un lien existant
        // peut conduire à la suspension du compte historique.
        if (input.clanRole === null) {
            if (!link)
                return { action: "no_link", roleChanged: false };
            const user = await this.userRepository.findById(link.memberId);
            if (!user || user.status === "DELETED") {
                return { action: "ignored", roleChanged: false };
            }
            const clanMember = await clan_repository_1.clanRepository.findByMemberId(user._id.toString());
            const wasActive = user.status !== "SUSPENDED" || clanMember?.active !== false;
            user.status = "SUSPENDED";
            await user.save();
            await clan_repository_1.clanRepository.upsert(user._id.toString(), clanMember ? { active: false } : { role: "INITIE", active: false });
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
            const passwordHash = await bcryptjs_1.default.hash(crypto_1.default.randomBytes(32).toString("hex"), 12);
            user = await user_model_1.User.create({
                email: `discord-${discordId}@discord.pacte.local`,
                passwordHash,
                role: roles_1.UserRole.PLAYER,
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
                await (0, discord_service_1.linkDiscord)({
                    memberId: user._id.toString(),
                    discordId,
                    discordUsername: username,
                });
            }
            catch (error) {
                await user_model_1.User.deleteOne({ _id: user._id });
                throw error;
            }
            created = true;
        }
        const memberId = user._id.toString();
        const clanMember = await clan_repository_1.clanRepository.findByMemberId(memberId);
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
        await (0, discord_service_1.linkDiscord)({
            memberId,
            discordId,
            discordUsername: username,
        });
        // Un portrait de clan existant est considéré comme personnalisé et n'est
        // jamais remplacé par Discord. À la création, l'avatar Discord est utilisé.
        const portrait = clanMember?.portrait ?? user.profile.avatar ?? input.avatarUrl?.trim() ?? null;
        await clan_repository_1.clanRepository.upsert(memberId, {
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
    buildDiscordUsername(discordId) {
        return `discord-${discordId}`.slice(0, 32);
    }
    /**
     * Le bot envoie l'inventaire complet du serveur Discord configuré. Les liens
     * absents de cet inventaire sont suspendus sans suppression de données.
     */
    async completeFullSync(seenDiscordIds) {
        const seen = new Set(seenDiscordIds.map((discordId) => discordId.trim()).filter(Boolean));
        const links = await (0, discord_repository_1.findAllLinks)();
        let deactivated = 0;
        for (const link of links) {
            if (seen.has(link.discordId))
                continue;
            const user = await this.userRepository.findById(link.memberId);
            if (!user || user.status === "DELETED")
                continue;
            const clanMember = await clan_repository_1.clanRepository.findByMemberId(user._id.toString());
            const needsDeactivation = user.status !== "SUSPENDED" || clanMember?.active !== false;
            if (!needsDeactivation)
                continue;
            user.status = "SUSPENDED";
            await user.save();
            await clan_repository_1.clanRepository.upsert(user._id.toString(), clanMember ? { active: false } : { role: "INITIE", active: false });
            deactivated += 1;
        }
        return { deactivated };
    }
}
exports.BotService = BotService;
exports.botService = new BotService();
