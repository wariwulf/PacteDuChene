import { apiFetch } from "@/lib/api/client";

export type ClanEventType = "COLLECTE" | "COMBAT" | "CEREMONIE" | "REUNION" | "SORTIE" | "AUTRE";
export type ClanEventMode = "INSTANT" | "LONG";
export type ClanEventStatus = "PUBLISHED" | "CANCELLED" | "COMPLETED" | "ARCHIVED";
export type ParticipationStatus = "ACCEPTED" | "MAYBE" | "DECLINED";
export type RecurrenceFrequency = "DAILY" | "WEEKLY" | "MONTHLY";
export type CurrencyId = "solidus" | "argent" | "bronze";

export interface EventObjective { objectiveId: string; title: string; description?: string; required: boolean; }
export interface EventReward { rewardId: string; currencyId: CurrencyId; amount: number; label?: string; }
export interface ParticipationOptions { accepted: boolean; declined: boolean; maybe: boolean; attempts: boolean; maxAttempts?: number; }
export interface Recurrence { enabled: boolean; frequency?: RecurrenceFrequency; interval?: number; weekdays?: number[]; monthDay?: number; nthWeek?: 1|2|3|4|5; nthWeekday?: number; until?: string; }
export interface ClanEvent {
  eventId: string; title: string; description?: string; type: ClanEventType; mode: ClanEventMode;
  startsAt: string; endsAt?: string; durationMinutes?: number; location?: string; discordChannel?: string; discordChannelId?: string;
  imageUrl?: string; objectives: EventObjective[]; rewards: EventReward[]; participationOptions: ParticipationOptions;
  reminderMinutes?: number; recurrence: Recurrence; seriesId?: string; occurrenceNumber?: number; status: ClanEventStatus;
  discordMessageId?: string;
}
export interface ClanEventWithParticipation { event: ClanEvent; participation: ParticipationStatus | null; counts: { ACCEPTED:number; MAYBE:number; DECLINED:number }; }

export function clanEventMediaUrl(value?: string | null) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;

  const api = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/$/, "");
  const base = api.endsWith("/api") ? api.slice(0, -4) : api;

  return `${base}${value.startsWith("/") ? value : `/${value}`}`;
}

export async function getUpcomingClanEvents(){const r=await apiFetch<{success:boolean;data:ClanEventWithParticipation[]}>("/clan-events/upcoming");return r.data;}
export async function getClanEvent(eventId:string){const r=await apiFetch<{success:boolean;data:ClanEventWithParticipation}>(`/clan-events/${encodeURIComponent(eventId)}`);return r.data;}
export async function setClanEventParticipation(eventId:string,status:ParticipationStatus){return apiFetch(`/clan-events/${encodeURIComponent(eventId)}/participation`,{method:"POST",body:JSON.stringify({status})});}
export async function removeClanEventParticipation(eventId:string){return apiFetch(`/clan-events/${encodeURIComponent(eventId)}/participation`,{method:"DELETE"});}
export async function getAdminClanEvents(){const r=await apiFetch<{success:boolean;data:ClanEvent[]}>("/clan-events/admin/all");return r.data;}
export async function createClanEvent(data:any){const r=await apiFetch<{success:boolean;data:ClanEvent}>("/clan-events/admin",{method:"POST",body:JSON.stringify(data)});return r.data;}
export async function updateClanEvent(eventId:string,data:any){const r=await apiFetch<{success:boolean;data:ClanEvent}>(`/clan-events/admin/${encodeURIComponent(eventId)}`,{method:"PATCH",body:JSON.stringify(data)});return r.data;}
export async function syncClanEventDiscord(eventId:string){const r=await apiFetch<{success:boolean;data:ClanEvent}>(`/clan-events/admin/${encodeURIComponent(eventId)}/sync-discord`,{method:"POST"});return r.data;}
export async function deleteClanEvent(eventId:string){return apiFetch(`/clan-events/admin/${encodeURIComponent(eventId)}`,{method:"DELETE"});}
export async function uploadClanEventImage(eventId:string,file:File){const base=(process.env.NEXT_PUBLIC_API_URL||"http://localhost:5000/api").replace(/\/$/,"");const form=new FormData();form.append("image",file);const r=await fetch(`${base}/clan-events/admin/${encodeURIComponent(eventId)}/image`,{method:"POST",credentials:"include",body:form});const p=await r.json().catch(()=>null);if(!r.ok||p?.success===false)throw new Error(p?.message||`Erreur serveur (${r.status})`);return p.data as ClanEvent;}
