export type FactionId = "domaine-du-chene" | "guilde-des-artisans" | "confrerie-de-lepee";

export type OrderKind = "RESOURCE" | "CRAFT" | "LOOT" | "CLAN";
export type OrderStatus = "PENDING" | "ACCEPTED" | "IN_PROGRESS" | "READY" | "COMPLETED" | "REFUSED" | "CANCELLED";
export type OrderVisibility = "PUBLIC" | "PRIVATE";

export interface FactionConfigData {
  factionId: FactionId;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  leaderRoleId: string;
  memberRoleIds: string[];
  orderChannelId: string;
  enabled: boolean;
}

export interface OrderItemSnapshot {
  itemId: string;
  name: string;
  imageUrl?: string;
  externalUrl?: string;
  quantity: number;
  kind: "PAXDEI_ITEM" | "CUSTOM";
}

export interface RecipeIngredientSnapshot {
  itemId?: string;
  name: string;
  quantity: number;
  imageUrl?: string;
}

export interface OrderDocumentData {
  orderId: string;
  factionId: FactionId;
  requesterId: string;
  source: "MEMBER" | "CLAN";
  kind: OrderKind;
  visibility: OrderVisibility;
  status: OrderStatus;
  title: string;
  message?: string;
  items: OrderItemSnapshot[];
  recipeIngredients?: RecipeIngredientSnapshot[];
  discordThreadId?: string;
  discordMessageId?: string;
  statusMessage?: string;
  createdAt?: Date;
  updatedAt?: Date;
  completedAt?: Date;
  deliveredAt?: Date;
  archivedAt?: Date;
}

export interface CreateOrderInput {
  kind?: OrderKind;
  visibility?: OrderVisibility;
  title?: string;
  message?: string;
  items: OrderItemSnapshot[];
  recipeIngredients?: RecipeIngredientSnapshot[];
}

export interface UpdateOrderStatusInput {
  status: OrderStatus;
  message?: string;
}
