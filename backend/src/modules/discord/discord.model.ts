import mongoose, { Document, Schema } from "mongoose";

export interface IDiscordLink extends Document {
  memberId: string;
  discordId: string;
  discordUsername?: string;
  linkedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const discordLinkSchema = new Schema<IDiscordLink>(
  {
    memberId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    discordId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    discordUsername: {
      type: String,
      trim: true,
      default: "",
    },

    linkedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const DiscordLink = mongoose.model<IDiscordLink>(
  "DiscordLink",
  discordLinkSchema
);
