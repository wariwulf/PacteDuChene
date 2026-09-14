import mongoose, { Document, Schema } from "mongoose";
import { PaxDeiItemData, PaxDeiItemLocalizedNames } from "./paxdei.items.types";

export interface PaxDeiItemDocument
  extends Document,
    Omit<PaxDeiItemData, "_id"> {}

const LocalizedNamesSchema = new Schema<PaxDeiItemLocalizedNames>(
  {},
  { _id: false, strict: false },
);

const PaxDeiItemSchema = new Schema<PaxDeiItemDocument>(
  {
    itemId: { type: String, required: true, unique: true, index: true, trim: true },
    name: { type: String, required: true, trim: true, index: true },
    names: { type: LocalizedNamesSchema, default: {} },
    imageUrl: { type: String, trim: true, default: "" },
    externalUrl: { type: String, trim: true, default: "" },
    source: { type: String, required: true, enum: ["gaming.tools"], default: "gaming.tools" },
    syncedAt: { type: Date, required: true, default: Date.now, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

PaxDeiItemSchema.index({ name: "text", "names.fr": "text", "names.en": "text" });

export const PaxDeiItem =
  mongoose.models.PaxDeiItem ||
  mongoose.model<PaxDeiItemDocument>("PaxDeiItem", PaxDeiItemSchema);
