export type PaxDeiResourceType = "GATHERABLE" | "MINEABLE" | "TREE";
export type PaxDeiFactionId =
  | "domaine-du-chene"
  | "guilde-des-artisans"
  | "confrerie-de-lepee";

export interface PaxDeiRecipeIngredient {
  itemId?: string;
  name: string;
  quantity: number;
  imageUrl?: string;
}

export interface PaxDeiRecipeData {
  recipeId: string;
  name: string;
  sourceUrl: string;
  resultItemId?: string;
  resultQuantity?: number;
  ingredients: PaxDeiRecipeIngredient[];
  craftedAt?: string[];
  skill?: string;
  difficulty?: number;
  metadata?: Record<string, unknown>;
  syncedAt: Date;
}

export interface PaxDeiResourceDrop {
  itemId: string;
  name?: string;
  quantity?: number;
}

export interface PaxDeiResourceData {
  resourceId: string;
  name: string;
  type: PaxDeiResourceType;
  sourceUrl: string;
  drops: PaxDeiResourceDrop[];
  metadata?: Record<string, unknown>;
  syncedAt: Date;
}

export interface PaxDeiFactionCatalogData {
  factionId: PaxDeiFactionId;
  itemId: string;
  reason: "RESOURCE_DROP" | "RECIPE_RESULT" | "FACTION_RELIC" | "MANUAL" | "MANUAL_EXCLUSION";
  sourceId?: string;
  enabled: boolean;
  syncedAt: Date;
}

export interface PaxDeiSyncResult {
  items: number;
  recipes: number;
  resources: number;
  factionCatalog: number;
  durationMs: number;
}
