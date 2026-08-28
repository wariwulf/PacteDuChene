export type AchievementLevel = 1 | 2 | 3;
export type AchievementSubmissionStatus = "pending" | "approved" | "rejected";

export interface Achievement {
  achievementId: string;
  name: string;
  description?: string;
  level: AchievementLevel;
  rewardCurrencyId?: string;
  rewardAmount: number;
  enabled: boolean;
  linkedQuestId?: string;
  linkedQuestName?: string;
}

export interface UserAchievement {
  userId: string;
  achievementId: string;
  unlockedAt: string;
  featuredOrder?: number;
}

export interface AchievementSubmissionAttachment {
  type: "image" | "video" | "audio";
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface AchievementSubmission {
  _id: string;
  userId: string;
  achievementId: string;
  message: string;
  attachments: AchievementSubmissionAttachment[];
  status: AchievementSubmissionStatus;
  adminResponse?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FeaturedUserAchievement {
  achievementId: string;
  name: string;
  description?: string;
  level: AchievementLevel;
  rewardCurrencyId?: string;
  rewardAmount: number;
  unlockedAt: string;
  featuredOrder: number;
}
