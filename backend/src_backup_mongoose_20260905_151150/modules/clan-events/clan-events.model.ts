import mongoose, { Document, Schema } from "mongoose";
import type {
  ClanEventData,
  ParticipationData,
  ClanEventType,
  ClanEventStatus,
  ParticipationStatus,
} from "./clan-events.types";

export type ClanEventDocument = ClanEventData & Document;
export type EventParticipationDocument =
  ParticipationData & Document;

const clanEventSchema = new Schema<ClanEventDocument>(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 5000,
    },
    type: {
      type: String,
      enum: [
        "COLLECTE",
        "COMBAT",
        "CEREMONIE",
        "REUNION",
        "SORTIE",
        "AUTRE",
      ] satisfies ClanEventType[],
      default: "AUTRE",
    },
    startsAt: {
      type: Date,
      required: true,
      index: true,
    },
    endsAt: {
      type: Date,
    },
    location: {
      type: String,
      trim: true,
      default: "",
      maxlength: 200,
    },
    discordChannel: {
      type: String,
      trim: true,
      default: "",
      maxlength: 100,
    },
    status: {
      type: String,
      enum: ["PUBLISHED", "CANCELLED", "COMPLETED"] satisfies ClanEventStatus[],
      default: "PUBLISHED",
      index: true,
    },
    createdBy: {
      type: String,
      trim: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const participationSchema =
  new Schema<EventParticipationDocument>(
    {
      eventId: {
        type: String,
        required: true,
        index: true,
        trim: true,
      },
      memberId: {
        type: String,
        required: true,
        index: true,
        trim: true,
      },
      status: {
        type: String,
        enum: ["ACCEPTED", "MAYBE", "DECLINED"] satisfies ParticipationStatus[],
        required: true,
      },
    },
    {
      timestamps: true,
    }
  );

participationSchema.index(
  { eventId: 1, memberId: 1 },
  { unique: true }
);

export const ClanEvent =
  mongoose.model<ClanEventDocument>(
    "ClanEvent",
    clanEventSchema
  );

export const EventParticipation =
  mongoose.model<EventParticipationDocument>(
    "EventParticipation",
    participationSchema
  );
