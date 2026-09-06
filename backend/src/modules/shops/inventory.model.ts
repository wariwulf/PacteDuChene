import mongoose,{Document,Schema} from "mongoose";
export interface InventoryDocument extends Document { userId:string; itemId:string; shopId:string; name:string; imageUrl?:string; description?:string; quantity:number; acquiredAt:Date; updatedAt:Date; }
const schema=new Schema<InventoryDocument>({userId:{type:String,required:true,index:true},itemId:{type:String,required:true,index:true},shopId:{type:String,required:true},name:{type:String,required:true},imageUrl:String,description:String,quantity:{type:Number,required:true,min:0},acquiredAt:{type:Date,default:Date.now}},{timestamps:true});
schema.index({userId:1,itemId:1},{unique:true});
export const Inventory=mongoose.models.Inventory||mongoose.model<InventoryDocument>("Inventory",schema);
