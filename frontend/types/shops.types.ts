export type ShopTier=1|2|3|4|5;
export interface ShopItem{itemId:string;name:string;imageUrl?:string;description?:string;externalUrl?:string;tier:ShopTier;price:number;currencyId:string;stock:number;enabled:boolean;purchaseLimit?:number;purchaseLimitWindowHours?:number;}
export interface Shop{shopId:string;name:string;description?:string;currencyId:string;enabled:boolean;items:ShopItem[];}
export interface InventoryItem{userId:string;itemId:string;shopId:string;name:string;imageUrl?:string;description?:string;quantity:number;acquiredAt:string;updatedAt:string;}
