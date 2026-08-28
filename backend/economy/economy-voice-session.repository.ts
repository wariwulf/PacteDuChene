import {
  EconomyVoiceSession,
  EconomyVoiceSessionDocument,
} from "./economy-voice-session.model";

export class EconomyVoiceSessionRepository {
  async findActive(guildId: string, discordId: string) {
    return EconomyVoiceSession.findOne({ guildId, discordId, active: true });
  }

  async create(data: {
    userId: string;
    guildId: string;
    discordId: string;
    channelId: string;
    startedAt: Date;
  }) {
    return EconomyVoiceSession.create({
      ...data,
      lastSeenAt: data.startedAt,
      active: true,
      lastRewardedInterval: 0,
    });
  }

  async touch(
    session: EconomyVoiceSessionDocument,
    channelId: string,
    now: Date
  ) {
    session.channelId = channelId;
    session.lastSeenAt = now;
    await session.save();
    return session;
  }

  async endMissing(guildId: string, activeDiscordIds: Set<string>, now: Date) {
    const sessions = await EconomyVoiceSession.find({ guildId, active: true });
    for (const session of sessions) {
      if (activeDiscordIds.has(session.discordId)) continue;
      session.active = false;
      session.endedAt = now;
      session.lastSeenAt = now;
      await session.save();
    }
  }
}

export const economyVoiceSessionRepository =
  new EconomyVoiceSessionRepository();
