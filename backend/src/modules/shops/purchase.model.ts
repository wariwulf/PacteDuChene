import mongoose,{Document,Schema} from "mongoose";
export interface PurchaseDocument extends Document { userId:string; shopId:string; itemId:string; itemName:string; quantity:number; unitPrice:number; totalPrice:number; currencyId:string; createdAt:Date; }
const schema=new Schema<PurchaseDocument>({userId:{type:String,required:true,index:true},shopId:{type:String,required:true},itemId:{type:String,required:true},itemName:{type:String,required:true},quantity:{type:Number,required:true,min:1},unitPrice:{type:Number,required:true,min:0},totalPrice:{type:Number,required:true,min:0},currencyId:{type:String,required:true}},{timestamps:{createdAt:true,updatedAt:false}});
schema.index({userId:1,itemId:1,createdAt:-1});
export const ShopPurchase=mongoose.models.ShopPurchase||mongoose.model<PurchaseDocument>("ShopPurchase",schema);
