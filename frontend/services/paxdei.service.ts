import { apiFetch } from "@/lib/api/client";

export interface PaxDeiItem {
  _id?: string;
  itemId: string;
  name: string;
  names?: Record<string, string | undefined>;
  imageUrl?: string;
  externalUrl?: string;
  source: "gaming.tools";
  syncedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface PaxDeiRecipeIngredient {
  itemId?: string;
  name: string;
  quantity: number;
  imageUrl?: string;
}

export interface PaxDeiRecipe {
  recipeId: string;
  name: string;
  url: string;
  ingredients: PaxDeiRecipeIngredient[];
}

export type PaxDeiFactionId =
  | "domaine-du-chene"
  | "guilde-des-artisans"
  | "confrerie-de-lepee";

export interface PaxDeiCatalogEntry {
  _id: string;
  factionId: PaxDeiFactionId;
  itemId: string;
  reason: "RESOURCE_DROP" | "RECIPE_RESULT" | "FACTION_RELIC" | "MANUAL" | "MANUAL_EXCLUSION";
  sourceId?: string;
  enabled: boolean;
  item?: Pick<PaxDeiItem, "itemId" | "name" | "names" | "imageUrl" | "externalUrl"> | null;
}

export async function searchPaxDeiItems(query: string, limit = 25, factionId?: string) {
  const params = new URLSearchParams({ q: query, lang: "fr", limit: String(limit) });
  if (factionId) params.set("factionId", factionId);

  const r = await apiFetch<{ success: boolean; data: { items: PaxDeiItem[] } }>(
    `/paxdei/items/search?${params.toString()}`,
  );
  return r.data.items;
}

export async function getPaxDeiItem(itemId: string) {
  const r = await apiFetch<{ success: boolean; data: { item: PaxDeiItem } }>(
    `/paxdei/items/${encodeURIComponent(itemId)}`,
  );
  return r.data.item;
}

export async function syncPaxDeiItems() {
  const r = await apiFetch<{ success: boolean; data: { count: number } }>(
    "/paxdei/items/sync",
    { method: "POST" },
  );
  return r.data.count;
}

export async function getPaxDeiRecipe(itemId: string) {
  const r = await apiFetch<{
    success: boolean;
    data: { recipe: PaxDeiRecipe };
  }>(
    `/paxdei/recipes/item/${encodeURIComponent(itemId)}`
  );

  return r.data.recipe;
}

export async function getPaxDeiFactionCatalog(factionId: PaxDeiFactionId) {
  const r = await apiFetch<{ success: boolean; data: { items: PaxDeiCatalogEntry[] } }>(
    `/paxdei/data/catalog/${encodeURIComponent(factionId)}`,
  );
  return r.data.items;
}

export async function addPaxDeiFactionCatalogItem(
  factionId: PaxDeiFactionId,
  itemId: string,
) {
  const r = await apiFetch<{ success: boolean; data: { entry: PaxDeiCatalogEntry } }>(
    `/paxdei/data/catalog/${encodeURIComponent(factionId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId }),
    },
  );
  return r.data.entry;
}

export async function removePaxDeiFactionCatalogItem(
  factionId: PaxDeiFactionId,
  itemId: string,
) {
  await apiFetch(
    `/paxdei/data/catalog/${encodeURIComponent(factionId)}/${encodeURIComponent(itemId)}`,
    { method: "DELETE" },
  );
}


export async function excludePaxDeiFactionCatalogItem(
  factionId: PaxDeiFactionId,
  itemId: string,
) {
  const r = await apiFetch<{ success: boolean; data: { entry: PaxDeiCatalogEntry } }>(
    `/paxdei/data/catalog/${encodeURIComponent(factionId)}/${encodeURIComponent(itemId)}/exclude`,
    {
      method: "POST",
    },
  );
  return r.data.entry;
}

export async function reinstatePaxDeiFactionCatalogItem(
  factionId: PaxDeiFactionId,
  itemId: string,
) {
  await apiFetch(
    `/paxdei/data/catalog/${encodeURIComponent(factionId)}/${encodeURIComponent(itemId)}/exclusion`,
    { method: "DELETE" },
  );
}
