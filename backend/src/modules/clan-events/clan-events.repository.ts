import {
  ClanEvent,
  EventParticipation,
} from "./clan-events.model";
import type {
  ClanEventData,
  ParticipationStatus,
} from "./clan-events.types";

export class ClanEventsRepository {
  async create(data: ClanEventData) {
    return ClanEvent.create(data);
  }

  async findByEventId(eventId: string) {
    return ClanEvent.findOne({ eventId });
  }

  async findUpcoming(now = new Date()) {
    return ClanEvent.find({
      status: "PUBLISHED",
      startsAt: { $gte: now },
    }).sort({ startsAt: 1 });
  }

  async findAll() {
    return ClanEvent.find().sort({ startsAt: 1 });
  }

  async update(eventId: string, data: Partial<ClanEventData>) {
    return ClanEvent.findOneAndUpdate(
      { eventId },
      { $set: data },
      { new: true, runValidators: true }
    );
  }

  async delete(eventId: string) {
    return ClanEvent.findOneAndDelete({ eventId });
  }

  async upsertParticipation(
    eventId: string,
    memberId: string,
    status: ParticipationStatus
  ) {
    return EventParticipation.findOneAndUpdate(
      { eventId, memberId },
      { $set: { status } },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );
  }

  async removeParticipation(
    eventId: string,
    memberId: string
  ) {
    return EventParticipation.findOneAndDelete({
      eventId,
      memberId,
    });
  }

  async removeAllParticipations(eventId: string) {
    return EventParticipation.deleteMany({ eventId });
  }

  async getParticipation(
    eventId: string,
    memberId: string
  ) {
    return EventParticipation.findOne({
      eventId,
      memberId,
    });
  }

  async countParticipation(eventId: string) {
    const counts = await EventParticipation.aggregate([
      { $match: { eventId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    return counts.reduce(
      (result, item) => {
        result[item._id] = item.count;
        return result;
      },
      {
        ACCEPTED: 0,
        MAYBE: 0,
        DECLINED: 0,
      } as Record<ParticipationStatus, number>
    );
  }
}

export const clanEventsRepository =
  new ClanEventsRepository();
