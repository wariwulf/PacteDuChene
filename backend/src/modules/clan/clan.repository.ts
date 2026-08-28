import {ClanMember} from "./clan.model";
import {ClanMemberInput} from "./clan.types";
export const clanRepository={
 findAll(){return ClanMember.find({active:true}).sort({displayOrder:1}).lean();},
 findAllMemberIds(){return ClanMember.find({},{memberId:1}).lean();},
 findByMemberId(memberId:string){return ClanMember.findOne({memberId}).lean();},
 upsert(memberId:string,data:Partial<ClanMemberInput>){return ClanMember.findOneAndUpdate({memberId},{$set:{...data,memberId}},{new:true,upsert:true,setDefaultsOnInsert:true}).lean();},
 updatePortrait(memberId:string,portrait:string){return ClanMember.findOneAndUpdate({memberId},{$set:{portrait}},{new:true}).lean();}
};
