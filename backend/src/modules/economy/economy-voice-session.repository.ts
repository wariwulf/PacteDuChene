import {
  EconomyVoiceSession,
  EconomyVoiceSessionDocument,
} from "./economy-voice-session.model";

export class EconomyVoiceSessionRepository {
  async find(
    guildId: string,
    discordId: string
  ): Promise<EconomyVoiceSessionDocument | null> {
    return EconomyVoiceSession.findOne({
      guildId,
      discordId,
    });
  }

  async create(data: {
    guildId: string;
    discordId: string;
    userId: string;
    channelId?: string | null;
    startedAt: Date;
    lastSeenAt: Date;
  }): Promise<EconomyVoiceSessionDocument> {
    return EconomyVoiceSession.create({
      ...data,
      accumulatedSeconds: 0,
      rewardedIntervals: 0,
      active: true,
    });
  }

  async save(
    session: EconomyVoiceSessionDocument
  ): Promise<EconomyVoiceSessionDocument> {
    return session.save();
  }

  async deactivateMissing(
    guildId: string,
    activeDiscordIds: string[]
  ): Promise<void> {
    if (activeDiscordIds.length === 0) {
      await EconomyVoiceSession.updateMany(
        { guildId, active: true },
        { $set: { active: false } }
      );
      return;
    }

    await EconomyVoiceSession.updateMany(
      {
        guildId,
        active: true,
        discordId: { $nin: activeDiscordIds },
      },
      {
        $set: { active: false },
      }
    );
  }
}

export const economyVoiceSessionRepository =
  new EconomyVoiceSessionRepository();
