import {Request,Response} from "express";
import {clanService} from "./clan.service";
const param=(v:string|string[]|undefined)=>Array.isArray(v)?v[0]??"":v??"";
export const clanController={
 async tree(_req:Request,res:Response){try{return res.json({success:true,data:await clanService.getTree()});}catch(error){console.error("Clan tree error:",error);return res.status(500).json({success:false,message:"Impossible de charger l'arbre du clan."});}},
 async getMember(req:Request,res:Response){const memberId=param(req.params.memberId);if(!memberId)return res.status(400).json({success:false,message:"Identifiant requis."});return res.json({success:true,data:await clanService.getMember(memberId)});},
 async saveMember(req:Request,res:Response){try{const memberId=param(req.params.memberId);if(!memberId)return res.status(400).json({success:false,message:"Identifiant requis."});return res.json({success:true,data:await clanService.saveMember({...req.body,memberId})});}catch(error){console.error(error);return res.status(400).json({success:false,message:"Impossible d'enregistrer la position."});}}
};
