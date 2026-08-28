export type GameEventType =
  | "enemy_killed"
  | "item_purchased"
  | "item_acquired"
  | "item_crafted"
  | "location_visited"
  | "npc_talked"
  | "resource_collected"
  | "quest_completed"
  | "achievement_unlocked";

export interface GameEvent {
  type: GameEventType;
  userId: string;

  targetId?: string;

  quantity?: number;

  metadata?: Record<string, unknown>;
}