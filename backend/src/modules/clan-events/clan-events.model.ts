import mongoose, { Document, Schema } from "mongoose";
import type {
  ClanEventData, ParticipationData, ClanEventType, ClanEventStatus,
  ParticipationStatus, ClanEventMode, AttendanceStatus,
  ObjectiveValidationStatus, RewardGrantStatus,
} from "./clan-events.types";

export type ClanEventDocument = ClanEventData & Document;
export type EventParticipationDocument = ParticipationData & Document;

const objectiveSchema = new Schema({
  objectiveId: { type: String, required: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, default: "", maxlength: 2000 },
  required: { type: Boolean, default: true },
  status: { type: String, enum: ["PENDING", "VALIDATED", "REJECTED"] satisfies ObjectiveValidationStatus[], default: "PENDING" },
  validatedAt: { type: Date },
  validatedBy: { type: String },
}, { _id: false });

const rewardSchema = new Schema({
  rewardId: { type: String, required: true },
  objectiveId: { type: String },
  currencyId: { type: String, enum: ["solidus", "argent", "bronze", "xp"], required: true },
  amount: { type: Number, required: true, min: 0 },
  label: { type: String, default: "", maxlength: 200 },
}, { _id: false });

const participationOptionsSchema = new Schema({
  accepted: { type: Boolean, default: true },
  declined: { type: Boolean, default: true },
  maybe: { type: Boolean, default: true },
  attempts: { type: Boolean, default: false },
  maxAttempts: { type: Number, min: 1 },
}, { _id: false });

const recurrenceSchema = new Schema({
  enabled: { type: Boolean, default: false },
  frequency: { type: String, enum: ["DAILY", "WEEKLY", "MONTHLY"] },
  interval: { type: Number, min: 1, default: 1 },
  weekdays: { type: [Number], default: undefined },
  monthDay: { type: Number, min: 1, max: 31 },
  nthWeek: { type: Number, min: 1, max: 5 },
  nthWeekday: { type: Number, min: 0, max: 6 },
  until: { type: Date },
}, { _id: false });

const rewardGrantSchema = new Schema({
  rewardId: { type: String, required: true },
  status: { type: String, enum: ["PENDING", "GRANTED"] satisfies RewardGrantStatus[], default: "PENDING" },
  grantedAt: { type: Date },
  grantedBy: { type: String },
}, { _id: false });

const clanEventSchema = new Schema<ClanEventDocument>({
  eventId: { type: String, required: true, unique: true, index: true, trim: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, default: "", maxlength: 5000 },
  type: { type: String, enum: ["COLLECTE","COMBAT","CEREMONIE","REUNION","SORTIE","AUTRE"] satisfies ClanEventType[], default: "AUTRE" },
  mode: { type: String, enum: ["INSTANT", "LONG"] satisfies ClanEventMode[], default: "INSTANT" },
  startsAt: { type: Date, required: true, index: true },
  endsAt: { type: Date, index: true },
  durationMinutes: { type: Number, min: 1 },
  location: { type: String, default: "", maxlength: 200 },
  discordChannel: { type: String, default: "", maxlength: 100 },
  imageUrl: { type: String, default: "", maxlength: 1000 },
  objectives: { type: [objectiveSchema], default: [] },
  rewards: { type: [rewardSchema], default: [] },
  participationOptions: { type: participationOptionsSchema, default: () => ({}) },
  reminderMinutes: { type: Number, min: 0 },
  recurrence: { type: recurrenceSchema, default: () => ({ enabled: false }) },
  seriesId: { type: String, index: true },
  occurrenceNumber: { type: Number, min: 1 },
  status: { type: String, enum: ["PUBLISHED","CANCELLED","COMPLETED","ARCHIVED"] satisfies ClanEventStatus[], default: "PUBLISHED", index: true },
  createdBy: { type: String, index: true },
  discordGuildId: { type: String },
  discordChannelId: { type: String },
  discordMessageId: { type: String },
  discordReminderMessageId: { type: String },
  discordReminderThreadId: { type: String },
  reminderSentAt: { type: Date },
  publishedAt: { type: Date },
  archivedAt: { type: Date },
  cleanupAt: { type: Date },
  discordSyncAt: { type: Date },
}, { timestamps: true });

const participationSchema = new Schema<EventParticipationDocument>({
  eventId: { type: String, required: true, index: true },
  memberId: { type: String, required: true, index: true },
  status: { type: String, enum: ["ACCEPTED","MAYBE","DECLINED"] satisfies ParticipationStatus[], required: true },
  attendance: { type: String, enum: ["PENDING","PRESENT","ABSENT"] satisfies AttendanceStatus[], default: "PENDING" },
  rewardGrants: { type: [rewardGrantSchema], default: [] },
  attemptsUsed: { type: Number, min: 0, default: 0 },
}, { timestamps: true });
participationSchema.index({ eventId: 1, memberId: 1 }, { unique: true });

export const ClanEvent = mongoose.models.ClanEvent || mongoose.model<ClanEventDocument>("ClanEvent", clanEventSchema);
export const EventParticipation = mongoose.models.EventParticipation || mongoose.model<EventParticipationDocument>("EventParticipation", participationSchema);
