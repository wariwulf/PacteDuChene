import mongoose,{Document,Schema} from "mongoose";
import {ClanRole} from "./clan.types";
export interface ClanMemberDocument extends Document {memberId:string;role:ClanRole;parentId:string|null;portrait:string|null;displayOrder:number;active:boolean;createdAt:Date;updatedAt:Date;}
const schema=new Schema<ClanMemberDocument>({memberId:{type:String,required:true,unique:true,index:true,trim:true},role:{type:String,required:true,enum:["REX","DUX_FOEDERIS","FRERE_JURE","SOEUR_JUREE","INITIE"]},parentId:{type:String,default:null,index:true},portrait:{type:String,default:null},displayOrder:{type:Number,default:0},active:{type:Boolean,default:true}},{timestamps:true});
export const ClanMember=mongoose.model<ClanMemberDocument>("ClanMember",schema);
