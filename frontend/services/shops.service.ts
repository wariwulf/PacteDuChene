import { apiFetch } from "@/lib/api/client";

export type ShopTier = 1 | 2 | 3 | 4 | 5;

export interface ShopItem {
  itemId: string;
  name: string;
  imageUrl?: string;
  description?: string;
  externalUrl?: string;
  tier: ShopTier;
  price: number;
  currencyId: string;
  stock: number;
  enabled: boolean;
  purchaseLimit?: number;
  purchaseLimitWindowHours?: number;
}

export interface Shop {
  shopId: string;
  name: string;
  description?: string;
  currencyId: string;
  enabled: boolean;
  items: ShopItem[];
}

export interface InventoryItem {
  userId: string;
  itemId: string;
  shopId: string;
  name: string;
  imageUrl?: string;
  description?: string;
  quantity: number;
  acquiredAt: string;
  updatedAt: string;
}

export interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  purchaseId?: string;
  userId?: string;
  readBy: string[];
  createdAt: string;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export async function getShops() {
  const r = await apiFetch<{ success: boolean; data: { shops: Shop[] } }>(
    "/shops",
  );
  return r.data.shops;
}

export async function getShop(id: string) {
  const r = await apiFetch<{ success: boolean; data: { shop: Shop } }>(
    `/shops/${encodeURIComponent(id)}`,
  );
  return r.data.shop;
}

export async function buyShopItem(
  shopId: string,
  itemId: string,
  quantity = 1,
) {
  const r = await apiFetch<{ success: boolean; data: any }>(
    `/shops/${encodeURIComponent(shopId)}/items/${encodeURIComponent(itemId)}/buy`,
    {
      method: "POST",
      body: JSON.stringify({ quantity }),
    },
  );
  return r.data;
}

export async function getInventory() {
  const r = await apiFetch<{
    success: boolean;
    data: { items: InventoryItem[] };
  }>("/shops/me/inventory");
  return r.data.items;
}

export async function getAdminNotifications() {
  const r = await apiFetch<{
    success: boolean;
    data: { notifications: Notification[]; unreadCount: number };
  }>("/shops/admin/notifications");
  return r.data;
}

export async function markNotificationRead(id: string) {
  return apiFetch(
    `/shops/admin/notifications/${encodeURIComponent(id)}/read`,
    { method: "POST" },
  );
}

export async function adminInventory(userId: string) {
  const r = await apiFetch<{
    success: boolean;
    data: { user: any; items: InventoryItem[] };
  }>(`/shops/admin/inventory/${encodeURIComponent(userId)}`);
  return r.data;
}

export async function adjustInventory(
  userId: string,
  itemId: string,
  quantity: number,
  reason: string,
) {
  const r = await apiFetch<{
    success: boolean;
    data: { item: InventoryItem | null };
  }>(
    `/shops/admin/inventory/${encodeURIComponent(userId)}/${encodeURIComponent(itemId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ quantity, reason }),
    },
  );
  return r.data.item;
}

export async function createShopItem(shopId: string, data: any) {
  const r = await apiFetch<{ success: boolean; data: { item: ShopItem } }>(
    `/shops/${encodeURIComponent(shopId)}/items`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
  return r.data;
}

export async function updateShopItem(
  shopId: string,
  itemId: string,
  data: any,
) {
  const r = await apiFetch<{ success: boolean; data: { item: ShopItem } }>(
    `/shops/${encodeURIComponent(shopId)}/items/${encodeURIComponent(itemId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
  );
  return r.data;
}

/**
 * Upload d'une image d'article.
 * On utilise fetch directement car apiFetch force Content-Type: application/json.
 */
export async function uploadShopItemImage(
  shopId: string,
  itemId: string,
  file: File,
) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(
    `${API_URL}/shops/${encodeURIComponent(shopId)}/items/${encodeURIComponent(itemId)}/image`,
    {
      method: "POST",
      credentials: "include",
      body: formData,
    },
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data?.success === false) {
    throw new Error(
      data?.message ?? "Impossible d'importer l'image de l'article.",
    );
  }

  return data.data as { item: ShopItem; imageUrl: string };
}

export async function deleteShopItem(shopId: string, itemId: string) {
  const r = await apiFetch<{ success: boolean; data: { item: ShopItem } }>(
    `/shops/${encodeURIComponent(shopId)}/items/${encodeURIComponent(itemId)}`,
    { method: "DELETE" },
  );
  return r.data.item;
}

export interface ShopPurchase {
  _id: string;
  userId: string;
  shopId: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currencyId: string;
  createdAt: string;
}

export async function getAdminPurchases(limit = 100) {
  const r = await apiFetch<{ success: boolean; data: { purchases: ShopPurchase[] } }>(
    `/shops/admin/purchases?limit=${limit}`,
  );
  return r.data.purchases;
}

export async function getAdminPurchase(id: string) {
  const r = await apiFetch<{
    success: boolean;
    data: {
      purchase: ShopPurchase;
      user: any;
      shop: Shop | null;
      item: ShopItem | null;
    };
  }>(`/shops/admin/purchases/${encodeURIComponent(id)}`);
  return r.data;
}
