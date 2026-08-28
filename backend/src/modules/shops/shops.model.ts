import { Schema, model } from "mongoose";
import { ShopDocument, ShopItem } from "./shops.types";

const shopItemSchema = new Schema<ShopItem>(
  {
    itemId: {
      type: String,
      required: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    stock: {
      type: Number,
      default: -1,
      min: -1,
    },

    enabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: false,
  }
);

const shopSchema = new Schema<ShopDocument>(
  {
    shopId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    currencyId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    enabled: {
      type: Boolean,
      default: true,
    },

    items: {
      type: [shopItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const Shop = model<ShopDocument>("Shop", shopSchema);