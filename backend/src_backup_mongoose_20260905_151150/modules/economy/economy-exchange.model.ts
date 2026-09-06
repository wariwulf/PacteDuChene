import mongoose, { Schema, Document } from "mongoose";

export interface EconomyExchangeSettingsDocument extends Document {
  key: "global";
  argentPerSolidus: number;
  bronzePerArgent: number;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<EconomyExchangeSettingsDocument>(
  {
    key: {
      type: String,
      enum: ["global"],
      unique: true,
      default: "global",
    },
    argentPerSolidus: {
      type: Number,
      required: true,
      default: 100,
      min: 0.000001,
    },
    bronzePerArgent: {
      type: Number,
      required: true,
      default: 100,
      min: 0.000001,
    },
  },
  { timestamps: true }
);

export const EconomyExchangeSettings =
  mongoose.model<EconomyExchangeSettingsDocument>(
    "EconomyExchangeSettings",
    schema
  );
