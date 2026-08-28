export interface ShopItem {
  itemId: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  enabled: boolean;
}

export interface ShopDocument {
  shopId: string;
  name: string;
  description?: string;
  currencyId: string;
  enabled: boolean;
  items: ShopItem[];
}