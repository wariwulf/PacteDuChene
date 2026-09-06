export interface InventoryItem {
  userId: string;
  itemId: string;
  quantity: number;
  acquiredAt: Date;
}

export interface AddInventoryItemInput {
  userId: string;
  itemId: string;
  quantity?: number;
}

export interface RemoveInventoryItemInput {
  userId: string;
  itemId: string;
  quantity?: number;
}