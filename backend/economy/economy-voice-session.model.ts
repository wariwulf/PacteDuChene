import mongoose, { Schema, Document } from "mongoose";

export interface EconomyVoiceSessionDocument extends Document {
  userId: string;
  guildId: string;
  discordId: string;
  channelId: string;
  startedAt: Date;
  lastSeenAt: Date;
  endedAt?: Date;
  active: boolean;
  lastRewardedInterval: number;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<EconomyVoiceSessionDocument>(
  {
    userId: { type: String, required: true, index: true },
    guildId: { type: String, required: true, index: true },
    discordId: { type: String, required: true, index: true },
    channelId: { type: String, required: true },
    startedAt: { type: Date, required: true },
    lastSeenAt: { type: Date, required: true },
    endedAt: { type: Date },
    active: { type: Boolean, required: true, default: true, index: true },
    lastRewardedInterval: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

schema.index({ guildId: 1, discordId: 1, active: 1 });

export const EconomyVoiceSession =
  mongoose.model<EconomyVoiceSessionDocument>("EconomyVoiceSession", schema);
