import { ClanEvent, EventParticipation } from "./clan-events.model";
import type { ClanEventData, ParticipationStatus } from "./clan-events.types";

export class ClanEventsRepository {
  async create(data: ClanEventData) { return ClanEvent.create(data); }
  async findByEventId(eventId: string) { return ClanEvent.findOne({ eventId }); }
  async findUpcoming(now = new Date()) { return ClanEvent.find({ status: "PUBLISHED", endsAt: { $gte: now } }).sort({ startsAt: 1 }); }
  async findAll() { return ClanEvent.find().sort({ startsAt: -1 }); }
  async update(eventId: string, data: Partial<ClanEventData>) { return ClanEvent.findOneAndUpdate({ eventId }, { $set: data }, { returnDocument: "after", runValidators: true }); }
  async touch(eventId: string) {
    const now = new Date();
    return ClanEvent.findOneAndUpdate(
      { eventId },
      { $set: { updatedAt: now, discordSyncAt: now } },
      { returnDocument: "after" },
    );
  }
  async delete(eventId: string) { return ClanEvent.findOneAndDelete({ eventId }); }
  async upsertParticipation(eventId: string, memberId: string, status: ParticipationStatus, attemptsUsed?: number) {
    const set: Record<string, unknown> = { status };
    if (attemptsUsed !== undefined) set.attemptsUsed = attemptsUsed;
    return EventParticipation.findOneAndUpdate({ eventId, memberId }, { $set: set }, { returnDocument: "after", upsert: true, runValidators: true, setDefaultsOnInsert: true });
  }
  async removeParticipation(eventId: string, memberId: string) { return EventParticipation.findOneAndDelete({ eventId, memberId }); }
  async removeAllParticipations(eventId: string) { await EventParticipation.deleteMany({ eventId }); }
  async getParticipation(eventId: string, memberId: string) { return EventParticipation.findOne({ eventId, memberId }); }
  async countParticipation(eventId: string) {
    const counts = await EventParticipation.aggregate([{ $match: { eventId } }, { $group: { _id: "$status", count: { $sum: 1 } } }]);
    return counts.reduce((r, i) => { r[i._id as ParticipationStatus] = i.count; return r; }, { ACCEPTED: 0, MAYBE: 0, DECLINED: 0 } as Record<ParticipationStatus, number>);
  }
  async findBotPublishable(now = new Date()) { return ClanEvent.find({ status: "PUBLISHED", discordMessageId: { $exists: false }, $or: [{ endsAt: { $gt: now } }, { endsAt: { $exists: false }, startsAt: { $gte: now } }] }).sort({ startsAt: 1 }).limit(25); }
  async findBotReminders(now = new Date()) { return ClanEvent.find({ status: "PUBLISHED", discordMessageId: { $exists: true }, reminderMinutes: { $gt: 0 }, reminderSentAt: { $exists: false }, startsAt: { $gt: now } }).sort({ startsAt: 1 }).limit(100); }
  async findActiveForBot() { return ClanEvent.find({ status: "PUBLISHED", discordMessageId: { $exists: true } }).sort({ startsAt: 1 }).limit(100); }
  async findBotCleanup(now = new Date()) {
    return ClanEvent.find({
      $or: [
        {
          status: "COMPLETED",
          cleanupAt: { $lte: now },
        },
        {
          status: { $in: ["PUBLISHED", "CANCELLED"] },
          endsAt: { $lte: now },
          cleanupAt: { $lte: now },
        },
      ],
    }).limit(25);
  }
  async markPublished(eventId: string, data: { discordGuildId: string; discordChannelId: string; discordMessageId: string; publishedAt: Date }) { return this.update(eventId, data); }
  async markReminderSent(eventId: string, reminderMessageId: string, reminderThreadId?: string) {
    return this.update(eventId, {
      discordReminderMessageId: reminderMessageId,
      discordReminderThreadId: reminderThreadId,
      reminderSentAt: new Date(),
    });
  }
  async archive(eventId: string) { return this.update(eventId, { status: "ARCHIVED", archivedAt: new Date() }); }
}
export const clanEventsRepository = new ClanEventsRepository();
