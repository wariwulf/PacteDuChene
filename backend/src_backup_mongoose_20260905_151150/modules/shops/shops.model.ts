import mongoose, { Document, Schema } from "mongoose";

export type ShopTier = 1 | 2 | 3 | 4 | 5;

export interface ShopItemDocument extends Document {
  shopId: string; itemId: string; name: string; imageUrl?: string; description?: string; externalUrl?: string;
  tier: ShopTier; price: number; currencyId: "solidus" | "argent" | "bronze"; stock: number; enabled: boolean;
  purchaseLimit?: number; purchaseLimitWindowHours?: number; createdAt: Date; updatedAt: Date;
}
export interface ShopDocument extends Document { shopId: string; name: string; description?: string; currencyId: "solidus" | "argent" | "bronze"; enabled: boolean; createdAt: Date; updatedAt: Date; }

const itemSchema = new Schema<ShopItemDocument>({
  shopId:{type:String,required:true,index:true}, itemId:{type:String,required:true}, name:{type:String,required:true,trim:true}, imageUrl:{type:String,trim:true}, description:{type:String,trim:true}, externalUrl:{type:String,trim:true},
  tier:{type:Number,required:true,enum:[1,2,3,4,5]}, price:{type:Number,required:true,min:0}, currencyId:{type:String,required:true,enum:["solidus","argent","bronze"]}, stock:{type:Number,required:true,min:-1}, enabled:{type:Boolean,default:true}, purchaseLimit:{type:Number,min:1}, purchaseLimitWindowHours:{type:Number,min:1}
},{timestamps:true});
itemSchema.index({shopId:1,itemId:1},{unique:true});

const shopSchema = new Schema<ShopDocument>({shopId:{type:String,required:true,unique:true,index:true},name:{type:String,required:true,trim:true},description:{type:String,trim:true},currencyId:{type:String,required:true,enum:["solidus","argent","bronze"]},enabled:{type:Boolean,default:true}},{timestamps:true});
export const Shop = mongoose.models.Shop || mongoose.model<ShopDocument>("Shop",shopSchema);
export const ShopItem = mongoose.models.ShopItem || mongoose.model<ShopItemDocument>("ShopItem",itemSchema);
