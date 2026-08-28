export type LevelSource =
  | "QUEST"
  | "ACHIEVEMENT"
  | "ADMIN";

export type LevelAction =
  | "XP_ADD"
  | "XP_REMOVE"
  | "XP_SET"
  | "LEVEL_SET";

export interface LevelDefinition {
  _id: string;
  level: number;
  name: string;
  description?: string;
  requiredXp: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LevelHistoryEntry {
  action: LevelAction;
  amount?: number;
  source: LevelSource;
  sourceId?: string;
  adminUserId?: string;
  reason?: string;

  previousXp: number;
  newXp: number;

  previousLevel: number;
  newLevel: number;

  createdAt: string;
}

export interface UserLevel {
  userId: string;
  xp: number;
  level: number;

  levelName: string;

  currentLevelXp: number;
  nextLevelXp: number | null;

  progressXp: number;
  progressPercent: number;

  history: LevelHistoryEntry[];
}

export interface LevelsResponse {
  success: boolean;
  data: {
    levels: LevelDefinition[];
  };
}

export interface UserLevelResponse {
  success: boolean;
  data: {
    level: UserLevel;
  };
}

export interface CreateLevelData {
  level: number;
  name: string;
  description?: string;
  requiredXp: number;
  enabled?: boolean;
}

export interface UpdateLevelData {
  name?: string;
  description?: string;
  requiredXp?: number;
  enabled?: boolean;
}

export interface XpModificationData {
  amount: number;
  reason?: string;
}

export interface XpSetData {
  xp: number;
  reason?: string;
}

export interface LevelSetData {
  level: number;
  reason?: string;
}