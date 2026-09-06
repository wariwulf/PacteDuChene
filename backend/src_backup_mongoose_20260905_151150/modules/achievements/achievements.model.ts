import mongoose, { Schema } from "mongoose";
import {
  AchievementDocument,
  UserAchievementDocument,
} from "./achievements.types";

const achievementSchema = new Schema<AchievementDocument>(
  {
    achievementId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    level: { type: Number, enum: [1, 2, 3], required: true, default: 1 },
    rewardCurrencyId: { type: String, trim: true },
    rewardAmount: { type: Number, required: true, default: 0, min: 0 },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const userAchievementSchema = new Schema<UserAchievementDocument>(
  {
    userId: { type: String, required: true, index: true },
    achievementId: { type: String, required: true, index: true },
    unlockedAt: { type: Date, default: Date.now },
    featuredOrder: {
      type: Number,
      enum: [1, 2, 3],
      min: 1,
      max: 3,
      required: false,
    },
  },
  { timestamps: false }
);

userAchievementSchema.index(
  { userId: 1, achievementId: 1 },
  { unique: true }
);

userAchievementSchema.index({ userId: 1, featuredOrder: 1 });

export const Achievement = mongoose.model<AchievementDocument>(
  "Achievement",
  achievementSchema
);

export const UserAchievement = mongoose.model<UserAchievementDocument>(
  "UserAchievement",
  userAchievementSchema
);
