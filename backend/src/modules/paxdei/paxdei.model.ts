import mongoose, { Document, Schema } from "mongoose";
import { PaxDeiCharacterData } from "./paxdei.types";

export interface PaxDeiCharacterDocument
  extends Document,
    Omit<PaxDeiCharacterData, "_id"> {}

const PaxDeiCharacterSchema =
  new Schema<PaxDeiCharacterDocument>(
    {
      memberId: {
        type: String,
        required: true,
        index: true,
        trim: true,
      },

      characterName: {
        type: String,
        required: true,
        trim: true,
      },

      avatarId: {
        type: String,
        trim: true,
        default: "",
      },

      world: {
        type: String,
        trim: true,
        default: "",
      },

      province: {
        type: String,
        trim: true,
        default: "",
      },

      region: {
        type: String,
        trim: true,
        default: "",
      },

      clan: {
        type: String,
        trim: true,
        default: "",
      },

      mainProfession: {
        type: String,
        trim: true,
        default: "",
      },

      secondaryProfessions: {
        type: [String],
        default: [],
      },

      isMainCharacter: {
        type: Boolean,
        default: false,
      },
    },
    {
      timestamps: true,
    }
  );

PaxDeiCharacterSchema.index({
  memberId: 1,
  characterName: 1,
});

export const PaxDeiCharacter =
  mongoose.model<PaxDeiCharacterDocument>(
    "PaxDeiCharacter",
    PaxDeiCharacterSchema
  );