import mongoose, { Document, Schema } from "mongoose";
import type { FactionConfigData, FactionId, OrderDocumentData, OrderKind, OrderStatus, OrderVisibility } from "./factions.types";

export type FactionModelDocument = FactionConfigData & Document;
export type OrderModelDocument = OrderDocumentData & Document;

const factionSchema = new Schema<FactionModelDocument>({
  factionId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, trim: true },
  shortName: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  icon: { type: String, required: true, trim: true },
  leaderRoleId: { type: String, required: true, trim: true },
  memberRoleIds: { type: [String], default: [] },
  orderChannelId: { type: String, required: true, trim: true },
  enabled: { type: Boolean, default: true },
}, { timestamps: true });

const itemSchema = new Schema({
  itemId: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true },
  imageUrl: { type: String, trim: true },
  externalUrl: { type: String, trim: true },
  quantity: { type: Number, required: true, min: 1 },
  kind: { type: String, enum: ["PAXDEI_ITEM", "CUSTOM"], required: true },
}, { _id: false });

const ingredientSchema = new Schema({
  itemId: { type: String, trim: true },
  name: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 1 },
  imageUrl: { type: String, trim: true },
}, { _id: false });

const orderSchema = new Schema<OrderModelDocument>({
  orderId: { type: String, required: true, unique: true, index: true },
  factionId: { type: String, required: true, index: true },
  requesterId: { type: String, required: true, index: true },
  source: { type: String, enum: ["MEMBER", "CLAN"], default: "MEMBER", required: true },
  kind: { type: String, enum: ["RESOURCE", "CRAFT", "LOOT", "CLAN"], required: true },
  visibility: { type: String, enum: ["PUBLIC", "PRIVATE"], default: "PUBLIC", required: true },
  status: { type: String, enum: ["PENDING", "ACCEPTED", "IN_PROGRESS", "READY", "COMPLETED", "REFUSED", "CANCELLED"] satisfies OrderStatus[], default: "PENDING", required: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  message: { type: String, trim: true, maxlength: 5000 },
  items: { type: [itemSchema], default: [] },
  recipeIngredients: { type: [ingredientSchema], default: [] },
  discordThreadId: { type: String, trim: true, index: true },
  discordMessageId: { type: String, trim: true },
  statusMessage: { type: String, trim: true, maxlength: 2000 },
  completedAt: { type: Date },
  deliveredAt: { type: Date },
  archivedAt: { type: Date, index: true },
}, { timestamps: true });

export const Faction = mongoose.model<FactionModelDocument>("Faction", factionSchema);
export const Order = mongoose.model<OrderModelDocument>("FactionOrder", orderSchema);
