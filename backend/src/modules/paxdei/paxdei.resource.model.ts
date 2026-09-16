import mongoose, { Document, Schema } from "mongoose";
import {
  PaxDeiResourceData,
  PaxDeiResourceDrop,
  PaxDeiResourceType,
} from "./paxdei.catalog.types";

const DropSchema = new Schema<PaxDeiResourceDrop>(
  {
    itemId: { type: String, required: true },
    name: { type: String, trim: true, default: "" },
    quantity: { type: Number, min: 0 },
  },
  { _id: false },
);

export interface PaxDeiResourceDocument
  extends Document,
    Omit<PaxDeiResourceData, "_id"> {}

const SchemaDef = new Schema<PaxDeiResourceDocument>(
  {
    resourceId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ["GATHERABLE", "MINEABLE", "TREE"] satisfies PaxDeiResourceType[],
      index: true,
    },
    sourceUrl: { type: String, required: true },
    drops: { type: [DropSchema], default: [] },
    metadata: { type: Schema.Types.Mixed, default: {} },
    syncedAt: { type: Date, required: true, default: Date.now, index: true },
  },
  { timestamps: true },
);

SchemaDef.index({ "drops.itemId": 1 });

export const PaxDeiResource =
  mongoose.models.PaxDeiResource ||
  mongoose.model<PaxDeiResourceDocument>("PaxDeiResource", SchemaDef);
