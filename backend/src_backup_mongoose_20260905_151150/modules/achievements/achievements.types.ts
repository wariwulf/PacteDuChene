export type AchievementLevel = 1 | 2 | 3;
export type AchievementSubmissionStatus = "pending" | "approved" | "rejected";

export interface AchievementDocument {
  achievementId: string;
  name: string;
  description?: string;
  level: AchievementLevel;
  rewardCurrencyId?: string;
  rewardAmount: number;
  enabled: boolean;
}

export interface AchievementWithQuestLink extends AchievementDocument {
  linkedQuestId?: string;
  linkedQuestName?: string;
}

export interface UserAchievementDocument {
  userId: string;
  achievementId: string;
  unlockedAt: Date;
  /** Position d'affichage sur le profil : 1, 2 ou 3. Absent = non mis en avant. */
  featuredOrder?: number;
}

export interface FeaturedUserAchievement {
  achievementId: string;
  name: string;
  description?: string;
  level: AchievementLevel;
  rewardCurrencyId?: string;
  rewardAmount: number;
  unlockedAt: Date;
  featuredOrder: number;
}
