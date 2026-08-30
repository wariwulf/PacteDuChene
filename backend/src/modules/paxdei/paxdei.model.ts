import mongoose, { Document, Schema } from "mongoose";
import { PaxDeiCharacterData, PaxDeiCombatRole } from "./paxdei.types";

export interface PaxDeiCharacterDocument extends Document, Omit<PaxDeiCharacterData, "_id"> {}

const DisciplineSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    level: { type: Number, required: true, min: 0, max: 40 },
  },
  { _id: false }
);

const PaxDeiCharacterSchema = new Schema<PaxDeiCharacterDocument>(
  {
    memberId: { type: String, required: true, index: true, trim: true },
    characterName: { type: String, required: true, trim: true, maxlength: 64 },
    avatarId: { type: String, trim: true, default: "" },
    world: { type: String, trim: true, default: "" },
    province: { type: String, trim: true, default: "" },
    region: { type: String, trim: true, default: "" },
    clan: { type: String, trim: true, default: "" },
    disciplines: { type: [DisciplineSchema], default: [] },
    // Legacy fields retained so existing MongoDB documents remain readable.
    mainProfession: { type: String, trim: true, default: "" },
    secondaryProfessions: { type: [String], default: [] },
    combatRole: {
      type: String,
      enum: ["TANK", "HEAL", "DPS"] satisfies PaxDeiCombatRole[],
      default: undefined,
    },
    specialization: { type: String, trim: true, maxlength: 64, default: "" },
    chronicleTitle: { type: String, trim: true, maxlength: 120, default: "" },
    chronicle: { type: String, trim: true, maxlength: 5000, default: "" },
    isMainCharacter: { type: Boolean, default: false },
  },
  { timestamps: true }
);

PaxDeiCharacterSchema.index({ memberId: 1, characterName: 1 });

export const PaxDeiCharacter = mongoose.model<PaxDeiCharacterDocument>(
  "PaxDeiCharacter",
  PaxDeiCharacterSchema
);
