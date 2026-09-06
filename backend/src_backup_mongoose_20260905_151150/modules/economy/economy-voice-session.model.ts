import mongoose, { Document, Schema } from "mongoose";

export interface EconomyVoiceSessionDocument extends Document {
  guildId: string;
  discordId: string;
  userId: string;
  channelId?: string | null;
  startedAt: Date;
  lastSeenAt: Date;
  accumulatedSeconds: number;
  rewardedIntervals: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const economyVoiceSessionSchema =
  new Schema<EconomyVoiceSessionDocument>(
    {
      guildId: {
        type: String,
        required: true,
        index: true,
        trim: true,
      },
      discordId: {
        type: String,
        required: true,
        index: true,
        trim: true,
      },
      userId: {
        type: String,
        required: true,
        index: true,
      },
      channelId: {
        type: String,
        default: null,
      },
      startedAt: {
        type: Date,
        required: true,
      },
      lastSeenAt: {
        type: Date,
        required: true,
      },
      accumulatedSeconds: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },
      rewardedIntervals: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },
      active: {
        type: Boolean,
        required: true,
        default: true,
        index: true,
      },
    },
    {
      timestamps: true,
    }
  );

economyVoiceSessionSchema.index(
  { guildId: 1, discordId: 1 },
  { unique: true }
);

export const EconomyVoiceSession =
  mongoose.models.EconomyVoiceSession ||
  mongoose.model<EconomyVoiceSessionDocument>(
    "EconomyVoiceSession",
    economyVoiceSessionSchema
  );
