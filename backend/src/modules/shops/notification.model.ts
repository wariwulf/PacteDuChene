import mongoose,{Document,Schema} from "mongoose";
export interface AdminNotificationDocument extends Document { type:string; title:string; message:string; purchaseId?:string; userId?:string; readBy:string[]; createdAt:Date; }
const schema=new Schema<AdminNotificationDocument>({type:{type:String,required:true},title:{type:String,required:true},message:{type:String,required:true},purchaseId:String,userId:String,readBy:{type:[String],default:[]}},{timestamps:{createdAt:true,updatedAt:false}});
export const AdminNotification=mongoose.models.AdminNotification||mongoose.model<AdminNotificationDocument>("AdminNotification",schema);
