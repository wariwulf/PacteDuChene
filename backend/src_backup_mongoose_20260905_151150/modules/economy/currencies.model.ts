import { Schema, model, Document } from "mongoose";
import { Currency } from "./currencies.types";

export type CurrencyDocument = Currency & Document;

const currencySchema = new Schema<CurrencyDocument>(
  {
    currencyId: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 64,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 255,
    },

    enabled: {
      type: Boolean,
      default: true,
    },

    icon: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const CurrencyModel = model<CurrencyDocument>(
  "Currency",
  currencySchema
);