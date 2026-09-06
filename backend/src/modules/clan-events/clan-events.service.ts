import { clanEventsRepository } from "./clan-events.repository";
import { EventParticipation } from "./clan-events.model";
import { findByDiscordId, findByMemberId } from "../discord/discord.repository";
import type { ClanEventData, ClanEventType, ParticipationStatus, RecurrenceData, EventRewardData } from "./clan-events.types";
import { economyService } from "../economy/economy.service";

const EVENT_TYPES: ClanEventType[] = ["COLLECTE","COMBAT","CEREMONIE","REUNION","SORTIE","AUTRE"];
const PARTICIPATION_STATUSES: ParticipationStatus[] = ["ACCEPTED","MAYBE","DECLINED"];
const TWO_HOURS = 2 * 60 * 60 * 1000;

function dateOnly(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()); }

export class ClanEventsService {
  async getUpcoming(memberId: string) {
    const events = await clanEventsRepository.findUpcoming();
    return Promise.all(events.map((event) => this.withMemberParticipation(event, memberId)));
  }

  async getEvent(eventId: string, memberId: string) {
    const event = await clanEventsRepository.findByEventId(eventId);
    if (!event || event.status === "ARCHIVED") throw new Error("Événement introuvable.");
    return this.withMemberParticipation(event, memberId);
  }

  async create(data: ClanEventData, createdBy: string) {
    this.validateEvent(data);
    if (await clanEventsRepository.findByEventId(data.eventId)) throw new Error("Un événement avec cet identifiant existe déjà.");
    const normalized = this.normalizeEvent(data);
    return clanEventsRepository.create({ ...normalized, createdBy, publishedAt: undefined });
  }

  async update(eventId: string, data: Partial<ClanEventData>) {
    const current = await clanEventsRepository.findByEventId(eventId);
    if (!current || current.status === "ARCHIVED") throw new Error("Événement introuvable.");
    if (data.title !== undefined && !data.title.trim()) throw new Error("Le titre de l'événement est obligatoire.");
    if (data.type !== undefined && !EVENT_TYPES.includes(data.type)) throw new Error("Type d'événement invalide.");
    if (data.startsAt !== undefined && Number.isNaN(new Date(data.startsAt).getTime())) throw new Error("La date de début est invalide.");
    if (data.endsAt !== undefined && data.endsAt && Number.isNaN(new Date(data.endsAt).getTime())) throw new Error("La date de fin est invalide.");

    const merged = { ...current.toObject(), ...data } as ClanEventData;
    this.validateEvent(merged, true);
    const normalized: Partial<ClanEventData> = { ...data };
    if (data.startsAt || data.endsAt || data.durationMinutes !== undefined) {
      const n = this.normalizeEvent(merged);
      normalized.startsAt = n.startsAt;
      normalized.endsAt = n.endsAt;
      normalized.durationMinutes = n.durationMinutes;
      normalized.cleanupAt = n.cleanupAt;
    }

    // Une fin manuelle doit permettre le nettoyage dès que possible,
    // même si l'heure de fin initiale est encore dans le futur.
    if (data.status === "COMPLETED") {
      normalized.cleanupAt = new Date();
    }

    // A modification invalidates the old reminder so the bot can schedule the new one.
    if (data.startsAt !== undefined || data.reminderMinutes !== undefined) {
      normalized.reminderSentAt = undefined;
      normalized.discordReminderMessageId = undefined;
      normalized.discordReminderThreadId = undefined;
    }
    return clanEventsRepository.update(eventId, normalized);
  }

  async remove(eventId: string) {
    const existing = await clanEventsRepository.findByEventId(eventId);
    if (!existing) throw new Error("Événement introuvable.");
    await clanEventsRepository.removeAllParticipations(eventId);
    return clanEventsRepository.delete(eventId);
  }

  async listAll() { return clanEventsRepository.findAll(); }

  /**
   * Signale au bot Discord que l'événement doit être resynchronisé.
   * Le bot surveille updatedAt pour détecter les changements.
   */
  async syncDiscord(eventId: string) {
    const event = await clanEventsRepository.findByEventId(eventId);
    if (!event || event.status === "ARCHIVED") {
      throw new Error("Événement introuvable.");
    }

    return clanEventsRepository.update(eventId, { discordSyncAt: new Date() } as any);
  }

  async setParticipation(eventId: string, memberId: string, status: ParticipationStatus) {
    if (!PARTICIPATION_STATUSES.includes(status)) throw new Error("Statut de participation invalide.");
    const event = await clanEventsRepository.findByEventId(eventId);
    if (!event || event.status === "ARCHIVED") throw new Error("Événement introuvable.");
    const options = event.participationOptions ?? { accepted: true, declined: true, maybe: true, attempts: false };
    if (status === "ACCEPTED" && !options.accepted) throw new Error("La réponse 'Je participe' n'est pas disponible pour cet événement.");
    if (status === "DECLINED" && !options.declined) throw new Error("La réponse 'Je ne participe pas' n'est pas disponible pour cet événement.");
    if (status === "MAYBE" && !options.maybe) throw new Error("La réponse 'Peut-être' n'est pas disponible pour cet événement.");
    const now = Date.now();
    if (event.endsAt && event.endsAt.getTime() < now) throw new Error("L'événement est terminé.");
    const participation = await clanEventsRepository.upsertParticipation(eventId, memberId, status);

    // Toute réponse doit signaler au bot Discord que le message doit être actualisé.
    await this.syncDiscord(eventId);

    return participation;
  }

  async setParticipationByDiscord(eventId: string, discordId: string, status: ParticipationStatus) {
    const link = await findByDiscordId(String(discordId));
    if (!link) throw new Error("Ce compte Discord n'est lié à aucun membre du Pacte.");
    return this.setParticipation(eventId, String(link.memberId), status);
  }

  async removeParticipation(eventId: string, memberId: string) {
    const result = await clanEventsRepository.removeParticipation(eventId, memberId);
    await this.syncDiscord(eventId);
    return result;
  }

  async getBotActions() {
    const now = new Date();
    const publish = await clanEventsRepository.findBotPublishable(now);
    const reminders = await clanEventsRepository.findBotReminders(now);
    const cleanup = await clanEventsRepository.findBotCleanup(now);
    return {
      publish: publish.map((event) => ({ eventId: event.eventId, event })),
      reminders: reminders.filter((event) => event.startsAt.getTime() - Number(event.reminderMinutes ?? 0) * 60000 <= now.getTime()).map((event) => ({ eventId: event.eventId, event })),
      cleanup: cleanup.map((event) => ({ eventId: event.eventId, discordChannelId: event.discordChannelId, discordMessageId: event.discordMessageId, discordReminderMessageId: event.discordReminderMessageId, discordReminderThreadId: event.discordReminderThreadId })),
    };
  }

  async botPublished(eventId: string, guildId: string, channelId: string, messageId: string) {
    const event = await clanEventsRepository.findByEventId(eventId);
    if (!event) throw new Error("Événement introuvable.");
    return clanEventsRepository.markPublished(eventId, { discordGuildId: guildId, discordChannelId: channelId, discordMessageId: messageId, publishedAt: new Date() });
  }

  async botReminderSent(eventId: string, messageId: string, threadId?: string) {
    const event = await clanEventsRepository.findByEventId(eventId);
    if (!event) throw new Error("Événement introuvable.");
    return clanEventsRepository.markReminderSent(eventId, messageId, threadId);
  }

  async botCleanupComplete(eventId: string) {
    const event = await clanEventsRepository.findByEventId(eventId);
    if (!event) throw new Error("Événement introuvable.");
    await this.grantRewards(eventId);
    const archived = await clanEventsRepository.archive(eventId);
    if (event.recurrence?.enabled) await this.createNextOccurrence(event);
    return archived;
  }

  async botActive() { return clanEventsRepository.findActiveForBot(); }

  async botEvent(eventId: string) {
    const event = await clanEventsRepository.findByEventId(eventId);
    if (!event) throw new Error("Événement introuvable.");

    const participations = await EventParticipation.find({ eventId }).lean();
    const grouped: Record<ParticipationStatus, Array<{ name: string; discordId: string }>> = {
      ACCEPTED: [],
      MAYBE: [],
      DECLINED: [],
    };

    await Promise.all(
      participations.map(async (participation) => {
        const link = await findByMemberId(String(participation.memberId));
        const status = String(participation.status) as ParticipationStatus;
        if (!link || !grouped[status]) return;
        grouped[status].push({
          name: link.discordUsername || `Membre ${String(participation.memberId).slice(0, 8)}`,
          discordId: String(link.discordId),
        });
      })
    );

    for (const status of Object.keys(grouped) as ParticipationStatus[]) {
      grouped[status].sort((a, b) => a.name.localeCompare(b.name, "fr"));
    }

    return {
      event,
      counts: await clanEventsRepository.countParticipation(eventId),
      participants: grouped,
    };
  }

  async grantRewards(eventId: string) {
    const event = await clanEventsRepository.findByEventId(eventId);
    if (!event) throw new Error("Événement introuvable.");
    const participants = await EventParticipation.find({ eventId, status: "ACCEPTED" });
    const rewards = event.rewards ?? [];
    const granted: Array<{ memberId: string; reward: EventRewardData }> = [];
    for (const participant of participants) {
      for (const reward of rewards) {
        if (reward.amount <= 0) continue;
        await economyService.addEventReward(participant.memberId, reward.currencyId, reward.amount, eventId, reward.rewardId, reward.label || `Récompense de l'événement « ${event.title} »`);
        granted.push({ memberId: participant.memberId, reward });
      }
    }
    return granted;
  }

  private normalizeEvent(data: ClanEventData): ClanEventData {
    const startsAt = new Date(data.startsAt);
    const duration = data.durationMinutes && data.durationMinutes > 0 ? data.durationMinutes : (data.endsAt ? Math.max(1, Math.round((new Date(data.endsAt).getTime() - startsAt.getTime()) / 60000)) : (data.mode === "LONG" ? 1440 : 120));
    const endsAt = new Date(startsAt.getTime() + duration * 60000);
    return {
      ...data,
      mode: data.mode ?? "INSTANT",
      startsAt,
      endsAt,
      durationMinutes: duration,
      participationOptions: data.participationOptions ?? { accepted: true, declined: true, maybe: true, attempts: false },
      objectives: data.objectives ?? [],
      rewards: data.rewards ?? [],
      recurrence: data.recurrence ?? { enabled: false },
      cleanupAt: new Date(endsAt.getTime() + TWO_HOURS),
    };
  }

  private validateEvent(data: ClanEventData, partial = false) {
    if (!partial && !data.eventId?.trim()) throw new Error("L'identifiant de l'événement est obligatoire.");
    if (!data.title?.trim()) throw new Error("Le titre de l'événement est obligatoire.");
    if (Number.isNaN(new Date(data.startsAt).getTime())) throw new Error("La date de début est invalide.");
    if (data.endsAt && Number.isNaN(new Date(data.endsAt).getTime())) throw new Error("La date de fin est invalide.");
    if (data.endsAt && new Date(data.endsAt).getTime() < new Date(data.startsAt).getTime()) throw new Error("La date de fin doit être postérieure à la date de début.");
    if (data.type && !EVENT_TYPES.includes(data.type)) throw new Error("Type d'événement invalide.");
    if (data.durationMinutes !== undefined && (!Number.isFinite(data.durationMinutes) || data.durationMinutes <= 0)) throw new Error("La durée doit être supérieure à 0.");
    if (data.reminderMinutes !== undefined && (!Number.isFinite(data.reminderMinutes) || data.reminderMinutes < 0)) throw new Error("Le rappel doit être un nombre positif ou nul.");
    for (const reward of data.rewards ?? []) if (!Number.isFinite(reward.amount) || reward.amount < 0) throw new Error("Une récompense est invalide.");
  }

  private async withMemberParticipation(event: any, memberId: string) {
    const [participation, counts] = await Promise.all([clanEventsRepository.getParticipation(event.eventId, memberId), clanEventsRepository.countParticipation(event.eventId)]);
    return { event, participation: participation?.status ?? null, counts };
  }

  private async createNextOccurrence(source: any) {
    const recurrence = source.recurrence as RecurrenceData | undefined;
    if (!recurrence?.enabled || !recurrence.frequency) return null;
    const nextStartsAt = this.nextOccurrence(new Date(source.startsAt), recurrence);
    if (!nextStartsAt || (recurrence.until && nextStartsAt > new Date(recurrence.until))) return null;
    const nextId = `${source.seriesId || source.eventId}--${nextStartsAt.toISOString().replace(/[:.]/g, "-")}`;
    if (await clanEventsRepository.findByEventId(nextId)) return null;
    const durationMinutes = Number(source.durationMinutes ?? Math.max(1, Math.round((new Date(source.endsAt).getTime() - new Date(source.startsAt).getTime()) / 60000)));
    return clanEventsRepository.create({
      ...source.toObject(), _id: undefined, eventId: nextId, startsAt: nextStartsAt,
      endsAt: new Date(nextStartsAt.getTime() + durationMinutes * 60000), durationMinutes,
      seriesId: source.seriesId || source.eventId, occurrenceNumber: Number(source.occurrenceNumber ?? 1) + 1,
      status: "PUBLISHED", discordMessageId: undefined, discordReminderMessageId: undefined,
      discordChannelId: undefined, discordGuildId: undefined, reminderSentAt: undefined,
      publishedAt: undefined, archivedAt: undefined, cleanupAt: new Date(nextStartsAt.getTime() + durationMinutes * 60000 + TWO_HOURS),
    });
  }

  private nextOccurrence(date: Date, recurrence: RecurrenceData): Date | null {
    const interval = Math.max(1, recurrence.interval ?? 1);
    if (recurrence.frequency === "DAILY") { const d = new Date(date); d.setDate(d.getDate() + interval); return d; }
    if (recurrence.frequency === "WEEKLY") {
      const weekdays = recurrence.weekdays?.length ? [...recurrence.weekdays].sort((a,b)=>a-b) : [date.getDay()];
      const current = date.getDay();
      for (const day of weekdays) if (day > current) { const d = new Date(date); d.setDate(d.getDate() + day-current); return d; }
      const d = new Date(date); d.setDate(d.getDate() + (7 * interval) - (current - weekdays[0])); return d;
    }
    const d = new Date(date); d.setMonth(d.getMonth() + interval);
    if (recurrence.nthWeek && recurrence.nthWeekday !== undefined) {
      d.setDate(1); const first = d.getDay(); d.setDate(1 + ((recurrence.nthWeekday - first + 7) % 7) + (recurrence.nthWeek - 1) * 7); return d;
    }
    d.setDate(Math.min(recurrence.monthDay ?? date.getDate(), new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate())); return d;
  }
}
export const clanEventsService = new ClanEventsService();
