export type QuestObjectiveValidationStatus =
  | "not_required"
  | "not_submitted"
  | "pending"
  | "approved"
  | "rejected";

export interface QuestObjective {
  objectiveId: string;
  name: string;
  description?: string;
  target: number;
  eventType?: string;
  eventTargetId?: string;
  requiresProof?: boolean;
}

export interface QuestStep {
  stepId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  difficulty: number;
  objectives: QuestObjective[];
}

export interface QuestDefinition {
  questId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  difficulty: number;
  prerequisites: string[];
  steps: QuestStep[];
  objectives: QuestObjective[];
  rewardXp: number;
  rewardCurrencyId?: string;
  rewardAmount: number;
  rewardAchievementId?: string;
  enabled: boolean;
}

export interface UserQuestObjective {
  objectiveId: string;
  current: number;
  validationStatus?: QuestObjectiveValidationStatus;
  lastSubmissionId?: string;
  validationMessage?: string;
  validatedAt?: Date;
}

export interface UserQuest {
  _id?: string;
  userId: string;
  questId: string;
  objectives: UserQuestObjective[];
  status: "active" | "completed";
  completionProcessing?: boolean;
  startedAt: string | Date;
  completedAt?: string | Date | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface QuestDocument extends QuestDefinition {
  _id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserQuestDocument extends UserQuest {
  _id?: string;
}

export interface CreateQuestData {
  questId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  difficulty: number;
  prerequisites?: string[];
  steps: QuestStep[];
  objectives: QuestObjective[];
  rewardXp: number;
  rewardCurrencyId?: string;
  rewardAmount: number;
  rewardAchievementId?: string;
  enabled: boolean;
}

export interface UpdateQuestProgressData {
  objectiveId: string;
  amount: number;
}

export interface QuestsResponse {
  success: boolean;
  data: { quests: QuestDefinition[] };
  message?: string;
}

export interface QuestResponse {
  success: boolean;
  data: { quest: QuestDefinition };
  message?: string;
}

export interface UserQuestsResponse {
  success: boolean;
  data: { quests: UserQuest[] };
  message?: string;
}

export interface UserQuestResponse {
  success: boolean;
  data: { quest: UserQuest };
  message?: string;
}

export interface QuestCompletionResponse {
  success: boolean;
  data: {
    quest?: UserQuest;
    rewards?: {
      xp?: number;
      currencyId?: string;
      amount?: number;
      achievementId?: string;
    };
    [key: string]: unknown;
  };
  message?: string;
}
