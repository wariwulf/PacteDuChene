import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware";
import { clanEventsService } from "./clan-events.service";
import type { ClanEventStatus, ClanEventType, ParticipationStatus } from "./clan-events.types";

function param(v: string | string[] | undefined) { return Array.isArray(v) ? (v[0] ?? "") : (v ?? ""); }
function userId(req: AuthenticatedRequest) { if (!req.user?.id) throw new Error("Authentification requise."); return req.user.id; }
function date(v: unknown): Date | undefined { if (v instanceof Date) return Number.isNaN(v.getTime()) ? undefined : v; if (typeof v !== "string" && typeof v !== "number") return undefined; const d = new Date(v); return Number.isNaN(d.getTime()) ? undefined : d; }
function message(e: unknown, fallback: string) { return e instanceof Error ? e.message : fallback; }

export async function listUpcoming(req: AuthenticatedRequest, res: Response) { try { return res.json({ success: true, data: await clanEventsService.getUpcoming(userId(req)) }); } catch (e) { return res.status(500).json({ success:false, message:message(e,"Impossible de charger les événements.") }); } }
export async function getEvent(req: AuthenticatedRequest, res: Response) { try { return res.json({ success:true, data:await clanEventsService.getEvent(param(req.params.eventId), userId(req)) }); } catch(e) { const m=message(e,"Impossible de charger l'événement."); return res.status(m.includes("introuvable")?404:500).json({success:false,message:m}); } }
export async function setParticipation(req: AuthenticatedRequest,res:Response){try{return res.json({success:true,data:await clanEventsService.setParticipation(param(req.params.eventId),userId(req),req.body?.status as ParticipationStatus)});}catch(e){return res.status(400).json({success:false,message:message(e,"Impossible d'enregistrer votre participation.")});}}
export async function removeParticipation(req: AuthenticatedRequest,res:Response){try{await clanEventsService.removeParticipation(param(req.params.eventId),userId(req));return res.json({success:true});}catch(e){return res.status(400).json({success:false,message:message(e,"Impossible de retirer votre participation.")});}}
export async function listAdmin(_req:AuthenticatedRequest,res:Response){try{return res.json({success:true,data:await clanEventsService.listAll()});}catch(e){return res.status(500).json({success:false,message:message(e,"Impossible de charger les événements.")});}}

function buildData(body:any, partial=false) {
  const data:any={};
  const keys=["title","description","type","mode","location","discordChannel","discordChannelId","imageUrl","objectives","rewards","participationOptions","reminderMinutes","recurrence","durationMinutes","status"];
  for(const k of keys) if(body[k]!==undefined) data[k]=body[k];
  if(!partial || body.startsAt!==undefined){const d=date(body.startsAt);if(!d)throw new Error("La date de début est invalide.");data.startsAt=d;}
  if(body.endsAt!==undefined){if(body.endsAt===null||body.endsAt==="")data.endsAt=undefined;else{const d=date(body.endsAt);if(!d)throw new Error("La date de fin est invalide.");data.endsAt=d;}}
  return data;
}
export async function createAdmin(req:AuthenticatedRequest,res:Response){try{const body=req.body??{};const event=await clanEventsService.create({...buildData(body),status:(body.status??"PUBLISHED") as ClanEventStatus} as any,userId(req));return res.status(201).json({success:true,data:event});}catch(e){return res.status(400).json({success:false,message:message(e,"Impossible de créer l'événement.")});}}
export async function updateAdmin(req:AuthenticatedRequest,res:Response){try{return res.json({success:true,data:await clanEventsService.update(param(req.params.eventId),buildData(req.body??{},true))});}catch(e){const m=message(e,"Impossible de modifier l'événement.");return res.status(m.includes("introuvable")?404:400).json({success:false,message:m});}}
export async function syncDiscord(req:AuthenticatedRequest,res:Response){try{return res.json({success:true,data:await clanEventsService.syncDiscord(param(req.params.eventId))});}catch(e){const m=message(e,"Impossible de demander la synchronisation Discord.");return res.status(m.includes("introuvable")?404:400).json({success:false,message:m});}}

export async function deleteAdmin(req:AuthenticatedRequest,res:Response){try{return res.json({success:true,data:await clanEventsService.remove(param(req.params.eventId))});}catch(e){return res.status(400).json({success:false,message:message(e,"Impossible de supprimer l'événement.")});}}

export async function uploadImage(req: AuthenticatedRequest, res: Response) {
  try {
    const eventId = param(req.params.eventId);
    const file = (req as any).file as { filename?: string } | undefined;
    if (!file?.filename) return res.status(400).json({ success:false, message:"Aucune image valide n'a été envoyée." });
    const event = await clanEventsService.update(eventId, { imageUrl: `/uploads/clan-events/${file.filename}` });
    return res.json({ success:true, data:event });
  } catch (e) { return res.status(400).json({ success:false, message:message(e,"Impossible d'enregistrer l'image.") }); }
}

export async function botActions(_req:AuthenticatedRequest,res:Response){try{return res.json({success:true,data:await clanEventsService.getBotActions()});}catch(e){return res.status(500).json({success:false,message:message(e,"Impossible de préparer les actions Discord.")});}}
export async function botEvent(req:AuthenticatedRequest,res:Response){try{return res.json({success:true,data:await clanEventsService.botEvent(param(req.params.eventId))});}catch(e){return res.status(404).json({success:false,message:message(e,"Événement introuvable.")});}}

export async function botActive(_req:AuthenticatedRequest,res:Response){try{return res.json({success:true,data:await clanEventsService.botActive()});}catch(e){return res.status(500).json({success:false,message:message(e,"Impossible de charger les événements Discord.")});}}
export async function botPublished(req:AuthenticatedRequest,res:Response){try{return res.json({success:true,data:await clanEventsService.botPublished(param(req.params.eventId),String(req.body?.guildId??""),String(req.body?.channelId??""),String(req.body?.messageId??""))});}catch(e){return res.status(400).json({success:false,message:message(e,"Impossible d'enregistrer la publication.")});}}
export async function botReminderSent(req:AuthenticatedRequest,res:Response){try{return res.json({success:true,data:await clanEventsService.botReminderSent(param(req.params.eventId),String(req.body?.messageId??""))});}catch(e){return res.status(400).json({success:false,message:message(e,"Impossible d'enregistrer le rappel.")});}}
export async function botCleanupComplete(req:AuthenticatedRequest,res:Response){try{return res.json({success:true,data:await clanEventsService.botCleanupComplete(param(req.params.eventId))});}catch(e){return res.status(400).json({success:false,message:message(e,"Impossible d'archiver l'événement.")});}}
export async function botParticipation(req:AuthenticatedRequest,res:Response){try{return res.json({success:true,data:await clanEventsService.setParticipationByDiscord(param(req.params.eventId),String(req.body?.discordId??""),req.body?.status as ParticipationStatus)});}catch(e){return res.status(400).json({success:false,message:message(e,"Impossible d'enregistrer la réponse Discord.")});}}
export async function botGrantRewards(req:AuthenticatedRequest,res:Response){try{return res.json({success:true,data:await clanEventsService.grantRewards(param(req.params.eventId))});}catch(e){return res.status(400).json({success:false,message:message(e,"Impossible d'attribuer les récompenses.")});}}
