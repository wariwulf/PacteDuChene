import { apiFetch } from "@/lib/api/client";

export type ClanEventType =
  | "COLLECTE" | "COMBAT" | "CEREMONIE" | "REUNION" | "SORTIE" | "AUTRE";
export type ClanEventStatus = "PUBLISHED" | "CANCELLED" | "COMPLETED";
export type ParticipationStatus = "ACCEPTED" | "MAYBE" | "DECLINED";

export interface ClanEvent {
  eventId: string;
  title: string;
  description?: string;
  type: ClanEventType;
  startsAt: string;
  endsAt?: string;
  location?: string;
  discordChannel?: string;
  status: ClanEventStatus;
}

export interface ClanEventWithParticipation {
  event: ClanEvent;
  participation: ParticipationStatus | null;
  counts: { ACCEPTED: number; MAYBE: number; DECLINED: number };
}

export async function getUpcomingClanEvents() {
  const r = await apiFetch<{ success: boolean; data: ClanEventWithParticipation[] }>(
    "/clan-events/upcoming"
  );
  return r.data;
}

export async function setClanEventParticipation(
  eventId: string,
  status: ParticipationStatus
) {
  return apiFetch<{ success: boolean; data: unknown }>(
    `/clan-events/${encodeURIComponent(eventId)}/participation`,
    { method: "POST", body: JSON.stringify({ status }) }
  );
}

export async function removeClanEventParticipation(eventId: string) {
  return apiFetch<{ success: boolean }>(
    `/clan-events/${encodeURIComponent(eventId)}/participation`,
    { method: "DELETE" }
  );
}

export async function getAdminClanEvents() {
  const r = await apiFetch<{ success: boolean; data: ClanEvent[] }>(
    "/clan-events/admin/all"
  );
  return r.data;
}

export async function createClanEvent(data: Omit<ClanEvent, "status"> & { status?: ClanEventStatus }) {
  const r = await apiFetch<{ success: boolean; data: ClanEvent }>(
    "/clan-events/admin",
    { method: "POST", body: JSON.stringify(data) }
  );
  return r.data;
}

export async function updateClanEvent(eventId: string, data: Partial<ClanEvent>) {
  const r = await apiFetch<{ success: boolean; data: ClanEvent }>(
    `/clan-events/admin/${encodeURIComponent(eventId)}`,
    { method: "PATCH", body: JSON.stringify(data) }
  );
  return r.data;
}

export async function deleteClanEvent(eventId: string) {
  return apiFetch<{ success: boolean }>(
    `/clan-events/admin/${encodeURIComponent(eventId)}`,
    { method: "DELETE" }
  );
}
