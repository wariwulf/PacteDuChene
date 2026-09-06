import mongoose, { Document, Schema } from "mongoose";

export interface InventoryItemDocument extends Document {
  userId: string;
  itemId: string;
  quantity: number;
  acquiredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const inventoryItemSchema =
  new Schema<InventoryItemDocument>(
    {
      userId: {
        type: String,
        required: true,
        index: true,
      },

      itemId: {
        type: String,
        required: true,
        index: true,
      },

      quantity: {
        type: Number,
        required: true,
        min: 0,
        default: 1,
      },

      acquiredAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      timestamps: true,
    }
  );

// Un seul emplacement par objet et par membre.
inventoryItemSchema.index(
  { userId: 1, itemId: 1 },
  { unique: true }
);

export const InventoryItem =
  mongoose.model<InventoryItemDocument>(
    "InventoryItem",
    inventoryItemSchema
  );