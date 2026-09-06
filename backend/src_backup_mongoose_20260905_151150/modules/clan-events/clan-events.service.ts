import {
  clanEventsRepository,
} from "./clan-events.repository";
import type {
  ClanEventData,
  ClanEventType,
  ParticipationStatus,
} from "./clan-events.types";

const EVENT_TYPES: ClanEventType[] = [
  "COLLECTE",
  "COMBAT",
  "CEREMONIE",
  "REUNION",
  "SORTIE",
  "AUTRE",
];

const PARTICIPATION_STATUSES: ParticipationStatus[] = [
  "ACCEPTED",
  "MAYBE",
  "DECLINED",
];

export class ClanEventsService {
  async getUpcoming(memberId: string) {
    const events = await clanEventsRepository.findUpcoming();
    return Promise.all(
      events.map((event) => this.withMemberParticipation(event, memberId))
    );
  }

  async getEvent(eventId: string, memberId: string) {
    const event = await clanEventsRepository.findByEventId(eventId);

    if (!event) {
      throw new Error("Événement introuvable.");
    }

    return this.withMemberParticipation(event, memberId);
  }

  async create(
    data: ClanEventData,
    createdBy: string
  ) {
    this.validateEvent(data);

    const existing =
      await clanEventsRepository.findByEventId(data.eventId);

    if (existing) {
      throw new Error(
        "Un événement avec cet identifiant existe déjà."
      );
    }

    return clanEventsRepository.create({
      ...data,
      createdBy,
    });
  }

  async update(
    eventId: string,
    data: Partial<ClanEventData>
  ) {
    if (data.title !== undefined && !data.title.trim()) {
      throw new Error("Le titre de l'événement est obligatoire.");
    }

    if (data.startsAt !== undefined && Number.isNaN(new Date(data.startsAt).getTime())) {
      throw new Error("La date de début est invalide.");
    }

    if (data.endsAt !== undefined && data.endsAt) {
      if (Number.isNaN(new Date(data.endsAt).getTime())) {
        throw new Error("La date de fin est invalide.");
      }
    }

    if (data.type !== undefined && !EVENT_TYPES.includes(data.type)) {
      throw new Error("Type d'événement invalide.");
    }

    return clanEventsRepository.update(eventId, data);
  }

  async remove(eventId: string) {
    const existing =
      await clanEventsRepository.findByEventId(eventId);

    if (!existing) {
      throw new Error("Événement introuvable.");
    }

    await clanEventsRepository.removeAllParticipations(eventId);
    return clanEventsRepository.delete(eventId);
  }

  async listAll() {
    return clanEventsRepository.findAll();
  }

  async setParticipation(
    eventId: string,
    memberId: string,
    status: ParticipationStatus
  ) {
    if (!PARTICIPATION_STATUSES.includes(status)) {
      throw new Error("Statut de participation invalide.");
    }

    const event =
      await clanEventsRepository.findByEventId(eventId);

    if (!event) {
      throw new Error("Événement introuvable.");
    }

    if (event.status !== "PUBLISHED") {
      throw new Error(
        "Les inscriptions sont fermées pour cet événement."
      );
    }

    if (event.startsAt.getTime() < Date.now()) {
      throw new Error(
        "Les inscriptions sont fermées car l'événement a commencé."
      );
    }

    return clanEventsRepository.upsertParticipation(
      eventId,
      memberId,
      status
    );
  }

  async removeParticipation(
    eventId: string,
    memberId: string
  ) {
    const event =
      await clanEventsRepository.findByEventId(eventId);

    if (!event) {
      throw new Error("Événement introuvable.");
    }

    return clanEventsRepository.removeParticipation(
      eventId,
      memberId
    );
  }

  private async withMemberParticipation(
    event: any,
    memberId: string
  ) {
    const [participation, counts] = await Promise.all([
      clanEventsRepository.getParticipation(
        event.eventId,
        memberId
      ),
      clanEventsRepository.countParticipation(
        event.eventId
      ),
    ]);

    return {
      event,
      participation: participation?.status ?? null,
      counts,
    };
  }

  private validateEvent(data: ClanEventData) {
    if (!data.eventId?.trim()) {
      throw new Error("L'identifiant de l'événement est obligatoire.");
    }

    if (!data.title?.trim()) {
      throw new Error("Le titre de l'événement est obligatoire.");
    }

    if (Number.isNaN(new Date(data.startsAt).getTime())) {
      throw new Error("La date de début est invalide.");
    }

    if (data.endsAt && Number.isNaN(new Date(data.endsAt).getTime())) {
      throw new Error("La date de fin est invalide.");
    }

    if (
      data.endsAt &&
      new Date(data.endsAt).getTime() < new Date(data.startsAt).getTime()
    ) {
      throw new Error(
        "La date de fin doit être postérieure à la date de début."
      );
    }

    if (data.type && !EVENT_TYPES.includes(data.type)) {
      throw new Error("Type d'événement invalide.");
    }
  }
}

export const clanEventsService =
  new ClanEventsService();
