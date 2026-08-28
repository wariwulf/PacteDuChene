import mongoose, { Schema } from "mongoose";
import { LoreDocument } from "./lore.types";

const loreSchema = new Schema<LoreDocument>({
  loreId: { type: String, required: true, unique: true, trim: true },
  title: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  summary: { type: String, trim: true },
  content: { type: String, required: true },
  enabled: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

export const Lore = mongoose.model<LoreDocument>("Lore", loreSchema);
