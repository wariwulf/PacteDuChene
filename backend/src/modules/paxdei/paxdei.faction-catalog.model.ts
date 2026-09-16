import mongoose, { Document, Schema } from "mongoose";
import {
  PaxDeiFactionCatalogData,
  PaxDeiFactionId,
} from "./paxdei.catalog.types";

export interface PaxDeiFactionCatalogDocument
  extends Document,
    Omit<PaxDeiFactionCatalogData, "_id"> {}

const SchemaDef = new Schema<PaxDeiFactionCatalogDocument>(
  {
    factionId: {
      type: String,
      required: true,
      enum: [
        "domaine-du-chene",
        "guilde-des-artisans",
        "confrerie-de-lepee",
      ] satisfies PaxDeiFactionId[],
    },
    itemId: { type: String, required: true, },
    reason: {
      type: String,
      required: true,
      enum: ["RESOURCE_DROP", "RECIPE_RESULT", "FACTION_RELIC", "MANUAL", "MANUAL_EXCLUSION"],
    },
    sourceId: { type: String, default: "" },
    enabled: { type: Boolean, default: true },
    syncedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
);

SchemaDef.index({ factionId: 1, itemId: 1 }, { unique: true });

export const PaxDeiFactionCatalog =
  mongoose.models.PaxDeiFactionCatalog ||
  mongoose.model<PaxDeiFactionCatalogDocument>(
    "PaxDeiFactionCatalog",
    SchemaDef,
  );
