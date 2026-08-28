"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.economyVoiceSessionRepository = exports.EconomyVoiceSessionRepository = void 0;
const economy_voice_session_model_1 = require("./economy-voice-session.model");
class EconomyVoiceSessionRepository {
    async findActive(guildId, discordId) {
        return economy_voice_session_model_1.EconomyVoiceSession.findOne({ guildId, discordId, active: true });
    }
    async create(data) {
        return economy_voice_session_model_1.EconomyVoiceSession.create({
            ...data,
            lastSeenAt: data.startedAt,
            active: true,
            lastRewardedInterval: 0,
        });
    }
    async touch(session, channelId, now) {
        session.channelId = channelId;
        session.lastSeenAt = now;
        await session.save();
        return session;
    }
    async endMissing(guildId, activeDiscordIds, now) {
        const sessions = await economy_voice_session_model_1.EconomyVoiceSession.find({ guildId, active: true });
        for (const session of sessions) {
            if (activeDiscordIds.has(session.discordId))
                continue;
            session.active = false;
            session.endedAt = now;
            session.lastSeenAt = now;
            await session.save();
        }
    }
}
exports.EconomyVoiceSessionRepository = EconomyVoiceSessionRepository;
exports.economyVoiceSessionRepository = new EconomyVoiceSessionRepository();
