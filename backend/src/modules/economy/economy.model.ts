import mongoose, { Schema } from "mongoose";
import { EconomyDocument } from "./economy.types";

const economySchema = new Schema<EconomyDocument>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    balances: {
      type: Map,
      of: Number,
      default: {
        solidus: 0,
        argent: 0,
        bronze: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

export const Economy = mongoose.model<EconomyDocument>(
  "Economy",
  economySchema
);
