import mongoose, { Document, Schema } from "mongoose";
import { PaxDeiRecipeData, PaxDeiRecipeIngredient } from "./paxdei.catalog.types";

const IngredientSchema = new Schema<PaxDeiRecipeIngredient>(
  {
    itemId: { type: String, trim: true, default: "" },
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    imageUrl: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

export interface PaxDeiRecipeDocument
  extends Document,
    Omit<PaxDeiRecipeData, "_id"> {}

const SchemaDef = new Schema<PaxDeiRecipeDocument>(
  {
    recipeId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, index: true },
    sourceUrl: { type: String, required: true },
    resultItemId: { type: String, default: "" },
    resultQuantity: { type: Number, min: 0, default: 1 },
    ingredients: { type: [IngredientSchema], default: [] },
    craftedAt: { type: [String], default: [] },
    skill: { type: String, default: "" },
    difficulty: { type: Number },
    metadata: { type: Schema.Types.Mixed, default: {} },
    syncedAt: { type: Date, required: true, default: Date.now, index: true },
  },
  { timestamps: true },
);

SchemaDef.index({ name: "text" });
SchemaDef.index({ resultItemId: 1 });

export const PaxDeiRecipe =
  mongoose.models.PaxDeiRecipe ||
  mongoose.model<PaxDeiRecipeDocument>("PaxDeiRecipe", SchemaDef);
