import {
  Achievement,
  UserAchievement,
} from "./achievements.model";
import {
  AchievementSubmission,
} from "./achievement-submission.model";
import type {
  AchievementLevel,
  FeaturedUserAchievement,
} from "./achievements.types";

export class AchievementsRepository {
  async findAll() {
    return Achievement.find().sort({ level: 1, name: 1 });
  }

  async findByAchievementId(achievementId: string) {
    return Achievement.findOne({ achievementId });
  }

  async create(data: {
    achievementId: string;
    name: string;
    description?: string;
    level: AchievementLevel;
    rewardCurrencyId?: string;
    rewardAmount: number;
    enabled?: boolean;
  }) {
    return Achievement.create(data);
  }

  async update(
    achievementId: string,
    data: {
      name?: string;
      description?: string;
      level?: AchievementLevel;
      rewardCurrencyId?: string;
      rewardAmount?: number;
      enabled?: boolean;
    }
  ) {
    return Achievement.findOneAndUpdate(
      { achievementId },
      data,
      { new: true, runValidators: true }
    );
  }

  async findUserAchievement(userId: string, achievementId: string) {
    return UserAchievement.findOne({ userId, achievementId });
  }

  async findUserAchievements(userId: string) {
    return UserAchievement.find({ userId }).sort({ unlockedAt: -1 });
  }

  async findFeaturedUserAchievements(userId: string): Promise<FeaturedUserAchievement[]> {
    const userAchievements = await UserAchievement.find({
      userId,
      featuredOrder: { $in: [1, 2, 3] },
    }).sort({ featuredOrder: 1 });

    if (!userAchievements.length) return [];

    const achievementIds = userAchievements.map((item) => item.achievementId);
    const achievements = await Achievement.find({
      achievementId: { $in: achievementIds },
    });

    const byId = new Map(
      achievements.map((achievement) => [achievement.achievementId, achievement])
    );

    return userAchievements.flatMap((userAchievement) => {
      const achievement = byId.get(userAchievement.achievementId);
      if (!achievement || !userAchievement.featuredOrder) return [];

      return [{
        achievementId: achievement.achievementId,
        name: achievement.name,
        description: achievement.description,
        level: achievement.level,
        rewardCurrencyId: achievement.rewardCurrencyId,
        rewardAmount: achievement.rewardAmount,
        unlockedAt: userAchievement.unlockedAt,
        featuredOrder: userAchievement.featuredOrder,
      }];
    });
  }

  async setFeaturedAchievements(userId: string, achievementIds: string[]) {
    await UserAchievement.updateMany(
      { userId },
      { $unset: { featuredOrder: 1 } }
    );

    for (let index = 0; index < achievementIds.length; index += 1) {
      await UserAchievement.updateOne(
        { userId, achievementId: achievementIds[index] },
        { $set: { featuredOrder: index + 1 } }
      );
    }

    return this.findFeaturedUserAchievements(userId);
  }

  async unlock(userId: string, achievementId: string) {
    return UserAchievement.create({
      userId,
      achievementId,
      unlockedAt: new Date(),
    });
  }

  async createSubmission(data: {
    userId: string;
    achievementId: string;
    message: string;
    attachments: {
      type: "image" | "video" | "audio";
      url: string;
      originalName: string;
      mimeType: string;
      size: number;
    }[];
    status: "pending";
  }) {
    return AchievementSubmission.create(data);
  }

  async findPendingSubmissions() {
    return AchievementSubmission.find({ status: "pending" }).sort({ createdAt: 1 });
  }

  async findUserSubmissions(userId: string, achievementId?: string) {
    return AchievementSubmission.find({
      userId,
      ...(achievementId ? { achievementId } : {}),
    }).sort({ createdAt: -1 });
  }

  async findSubmission(submissionId: string) {
    return AchievementSubmission.findById(submissionId);
  }

  async findPendingSubmission(userId: string, achievementId: string) {
    return AchievementSubmission.findOne({
      userId,
      achievementId,
      status: "pending",
    });
  }

  async reviewSubmission(
    submissionId: string,
    data: {
      status: "approved" | "rejected";
      adminResponse?: string;
      reviewedBy: string;
    }
  ) {
    return AchievementSubmission.findOneAndUpdate(
      { _id: submissionId, status: "pending" },
      {
        $set: {
          ...data,
          reviewedAt: new Date(),
        },
      },
      { new: true }
    );
  }
}

export const achievementsRepository = new AchievementsRepository();
