import { apiFetch } from "@/lib/api/client";

export type FactionId = "domaine-du-chene" | "guilde-des-artisans" | "confrerie-de-lepee";
export type OrderKind = "RESOURCE" | "CRAFT" | "LOOT" | "CLAN";
export type OrderStatus = "PENDING" | "ACCEPTED" | "IN_PROGRESS" | "READY" | "COMPLETED" | "REFUSED" | "CANCELLED";
export type OrderVisibility = "PUBLIC" | "PRIVATE";

export interface Faction { factionId: FactionId; name: string; shortName: string; description: string; icon: string; leaderRoleId: string; memberRoleIds: string[]; orderChannelId: string; enabled: boolean; }
export interface OrderItem { itemId: string; name: string; imageUrl?: string; externalUrl?: string; quantity: number; kind: "PAXDEI_ITEM" | "CUSTOM"; }
export interface RecipeIngredient { itemId?: string; name: string; quantity: number; imageUrl?: string; }
export interface FactionOrder { orderId: string; factionId: FactionId; requesterId: string; source: "MEMBER" | "CLAN"; kind: OrderKind; visibility: OrderVisibility; status: OrderStatus; title: string; message?: string; items: OrderItem[]; recipeIngredients?: RecipeIngredient[]; discordThreadId?: string; discordMessageId?: string; statusMessage?: string; createdAt?: string; updatedAt?: string; completedAt?: string; deliveredAt?: string; archivedAt?: string; }
export interface FactionMembership { factionId: FactionId; member: boolean; leader: boolean; }

export async function getFactions() { const r = await apiFetch<{success:boolean;data:{factions:Faction[]}}>("/factions"); return r.data.factions; }
export async function getFaction(id: FactionId) { const r = await apiFetch<{success:boolean;data:{faction:Faction}}>(`/factions/${id}`); return r.data.faction; }
export async function getFactionMembership() { const r = await apiFetch<{success:boolean;data:{factions:FactionMembership[]}}>("/factions/membership"); return r.data.factions; }
export async function getFactionOrders(id: FactionId) { const r = await apiFetch<{success:boolean;data:{orders:FactionOrder[]}}>(`/factions/${id}/orders`); return r.data.orders; }
export async function getMyOrders() { const r = await apiFetch<{success:boolean;data:{orders:FactionOrder[]}}>("/factions/orders/mine"); return r.data.orders; }
export async function getOrder(id: string) { const r = await apiFetch<{success:boolean;data:{order:FactionOrder}}>(`/factions/orders/${encodeURIComponent(id)}`); return r.data.order; }
export async function createFactionOrder(id: FactionId, payload: {kind: OrderKind; visibility: OrderVisibility; title: string; message?: string; items: OrderItem[]; recipeIngredients?: RecipeIngredient[]}) { const r = await apiFetch<{success:boolean;data:{order:FactionOrder}}>(`/factions/${id}/orders`, {method:"POST", body: JSON.stringify(payload)}); return r.data.order; }
export async function updateOrderStatus(id: string, status: OrderStatus, message?: string) { const r = await apiFetch<{success:boolean;data:{order:FactionOrder}}>(`/factions/orders/${encodeURIComponent(id)}/status`, {method:"PATCH", body: JSON.stringify({status,message})}); return r.data.order; }
export async function updateFaction(id: FactionId, payload: Partial<Faction>) { const r = await apiFetch<{success:boolean;data:{faction:Faction}}>(`/factions/${id}`, {method:"PATCH", body: JSON.stringify(payload)}); return r.data.faction; }
