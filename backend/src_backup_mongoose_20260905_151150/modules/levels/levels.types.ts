export type LevelSource =
  | "QUEST"
  | "ACHIEVEMENT"
  | "ADMIN";

export type LevelAction =
  | "XP_ADD"
  | "XP_REMOVE"
  | "XP_SET"
  | "LEVEL_SET";

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

  createdAt: Date;
}

export interface LevelResponse {
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

/*
 * Alias de compatibilité.
 *
 * Ils permettent aux fichiers existants du module
 * de continuer à fonctionner sans créer deux systèmes
 * de types différents.
 */

export type LevelHistoryAction = LevelAction;

export type LevelXpSource = LevelSource;

export type UserLevelResponse = LevelResponse;