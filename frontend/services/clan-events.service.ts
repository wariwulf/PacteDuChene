import { apiFetch } from "@/lib/api/client";

export type ClanEventType = "COLLECTE" | "COMBAT" | "CEREMONIE" | "REUNION" | "SORTIE" | "AUTRE";
export type ClanEventMode = "INSTANT" | "LONG";
export type ClanEventStatus = "PUBLISHED" | "CANCELLED" | "COMPLETED" | "ARCHIVED";
export type ParticipationStatus = "ACCEPTED" | "MAYBE" | "DECLINED";
export type AttendanceStatus = "PENDING" | "PRESENT" | "ABSENT";
export type ObjectiveValidationStatus = "PENDING" | "VALIDATED" | "REJECTED";
export type RewardGrantStatus = "PENDING" | "GRANTED";
export type RecurrenceFrequency = "DAILY" | "WEEKLY" | "MONTHLY";
export type CurrencyId = "solidus" | "argent" | "bronze" | "xp";

export interface EventObjective {
  objectiveId: string;
  title: string;
  description?: string;
  required: boolean;
  status?: ObjectiveValidationStatus;
  validatedAt?: string;
  validatedBy?: string;
}

export interface EventReward {
  rewardId: string;
  objectiveId?: string;
  currencyId: CurrencyId;
  amount: number;
  label?: string;
}

export interface RewardGrant {
  rewardId: string;
  status: RewardGrantStatus;
  grantedAt?: string;
  grantedBy?: string;
}

export interface ParticipationOptions {
  accepted: boolean;
  declined: boolean;
  maybe: boolean;
  attempts: boolean;
  maxAttempts?: number;
}

export interface Recurrence {
  enabled: boolean;
  frequency?: RecurrenceFrequency;
  interval?: number;
  weekdays?: number[];
  monthDay?: number;
  nthWeek?: 1 | 2 | 3 | 4 | 5;
  nthWeekday?: number;
  until?: string;
}

export interface ClanEvent {
  eventId: string;
  title: string;
  description?: string;
  type: ClanEventType;
  mode: ClanEventMode;
  startsAt: string;
  endsAt?: string;
  durationMinutes?: number;
  location?: string;
  discordChannel?: string;
  discordChannelId?: string;
  imageUrl?: string;
  objectives: EventObjective[];
  rewards: EventReward[];
  participationOptions: ParticipationOptions;
  reminderMinutes?: number;
  recurrence: Recurrence;
  seriesId?: string;
  occurrenceNumber?: number;
  status: ClanEventStatus;
  discordMessageId?: string;
}

export interface ClanEventWithParticipation {
  event: ClanEvent;
  participation: ParticipationStatus | null;
  counts: { ACCEPTED: number; MAYBE: number; DECLINED: number };
}

export interface AdminEventParticipant {
  eventId: string;
  memberId: string;
  status: ParticipationStatus;
  attendance?: AttendanceStatus;
  rewardGrants?: RewardGrant[];
  attemptsUsed?: number;
  createdAt?: string;
  updatedAt?: string;
  member?: {
    id: string;
    username: string;
    displayName?: string;
    characterName?: string;
    avatar?: string;
    discordUsername?: string;
  };
}

export interface AdminEventMember {
  _id: string;
  profile?: { username?: string; displayName?: string; avatar?: string };
  discord?: { username?: string };
  paxDei?: { characterName?: string };
}

export function clanEventMediaUrl(value?: string | null) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  const api = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/$/, "");
  const base = api.endsWith("/api") ? api.slice(0, -4) : api;
  return `${base}${value.startsWith("/") ? value : `/${value}`}`;
}

export async function getUpcomingClanEvents() {
  const r = await apiFetch<{ success: boolean; data: ClanEventWithParticipation[] }>("/clan-events/upcoming");
  return r.data;
}
export async function getClanEvent(eventId: string) {
  const r = await apiFetch<{ success: boolean; data: ClanEventWithParticipation }>(`/clan-events/${encodeURIComponent(eventId)}`);
  return r.data;
}
export async function setClanEventParticipation(eventId: string, status: ParticipationStatus) {
  return apiFetch(`/clan-events/${encodeURIComponent(eventId)}/participation`, { method: "POST", body: JSON.stringify({ status }) });
}
export async function removeClanEventParticipation(eventId: string) {
  return apiFetch(`/clan-events/${encodeURIComponent(eventId)}/participation`, { method: "DELETE" });
}
export async function getAdminClanEvents() {
  const r = await apiFetch<{ success: boolean; data: ClanEvent[] }>("/clan-events/admin/all");
  return r.data;
}
export async function createClanEvent(data: unknown) {
  const r = await apiFetch<{ success: boolean; data: ClanEvent }>("/clan-events/admin", { method: "POST", body: JSON.stringify(data) });
  return r.data;
}
export async function updateClanEvent(eventId: string, data: unknown) {
  const r = await apiFetch<{ success: boolean; data: ClanEvent }>(`/clan-events/admin/${encodeURIComponent(eventId)}`, { method: "PATCH", body: JSON.stringify(data) });
  return r.data;
}
export async function syncClanEventDiscord(eventId: string) {
  const r = await apiFetch<{ success: boolean; data: ClanEvent }>(`/clan-events/admin/${encodeURIComponent(eventId)}/sync-discord`, { method: "POST" });
  return r.data;
}
export async function deleteClanEvent(eventId: string) {
  return apiFetch(`/clan-events/admin/${encodeURIComponent(eventId)}`, { method: "DELETE" });
}
export async function uploadClanEventImage(eventId: string, file: File) {
  const base = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/$/, "");
  const form = new FormData();
  form.append("image", file);
  const response = await fetch(`${base}/clan-events/admin/${encodeURIComponent(eventId)}/image`, { method: "POST", credentials: "include", body: form });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) throw new Error(payload?.message || `Erreur serveur (${response.status})`);
  return payload.data as ClanEvent;
}

export async function getAdminClanEventParticipants(eventId: string) {
  const r = await apiFetch<{ success: boolean; data: AdminEventParticipant[] }>(`/clan-events/admin/${encodeURIComponent(eventId)}/participants`);
  return r.data;
}
export async function getAdminClanEventMembers(eventId: string) {
  const r = await apiFetch<{ success: boolean; data: AdminEventMember[] }>(`/clan-events/admin/${encodeURIComponent(eventId)}/members`);
  return r.data;
}
export async function addAdminClanEventParticipant(eventId: string, memberId: string) {
  const r = await apiFetch<{ success: boolean; data: AdminEventParticipant }>(`/clan-events/admin/${encodeURIComponent(eventId)}/participants`, { method: "POST", body: JSON.stringify({ memberId }) });
  return r.data;
}
export async function removeAdminClanEventParticipant(eventId: string, memberId: string) {
  const r = await apiFetch<{ success: boolean; data: { memberId: string } }>(`/clan-events/admin/${encodeURIComponent(eventId)}/participants/${encodeURIComponent(memberId)}`, { method: "DELETE" });
  return r.data;
}
export async function setAdminClanEventAttendance(eventId: string, memberId: string, attendance: AttendanceStatus) {
  const r = await apiFetch<{ success: boolean; data: AdminEventParticipant }>(`/clan-events/admin/${encodeURIComponent(eventId)}/participants/${encodeURIComponent(memberId)}/attendance`, { method: "PATCH", body: JSON.stringify({ attendance }) });
  return r.data;
}
export async function setAdminClanEventObjectiveValidation(eventId: string, objectiveId: string, status: ObjectiveValidationStatus) {
  const r = await apiFetch<{ success: boolean; data: ClanEvent }>(`/clan-events/admin/${encodeURIComponent(eventId)}/objectives/${encodeURIComponent(objectiveId)}`, { method: "PATCH", body: JSON.stringify({ status }) });
  return r.data;
}
