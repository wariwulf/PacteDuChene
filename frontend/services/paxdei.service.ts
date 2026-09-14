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

export async function searchPaxDeiItems(query: string, limit = 25) {
  const params = new URLSearchParams({ q: query, lang: "fr", limit: String(limit) });
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
