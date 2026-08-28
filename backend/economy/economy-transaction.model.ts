import mongoose, {
  Schema,
  Document,
} from "mongoose";

export type EconomyTransactionType =
  | "quest_reward"
  | "achievement_reward"
  | "purchase"
  | "admin_add"
  | "admin_remove"
  | "exchange"
  | "daily_reward"
  | "voice_reward"
  | "other";

export interface EconomyTransactionDocument
  extends Document {

  userId: string;

  currencyId: string;

  amount: number;

  type: EconomyTransactionType;

  source?: string;

  sourceId?: string;

  description?: string;

  createdAt: Date;

  updatedAt: Date;
}

const economyTransactionSchema =
  new Schema<EconomyTransactionDocument>(
    {
      userId: {
        type: String,
        required: true,
        index: true,
      },

      currencyId: {
        type: String,
        required: true,
        index: true,
      },

      amount: {
        type: Number,
        required: true,
      },

      type: {
        type: String,
        required: true,
        enum: [
          "quest_reward",
          "achievement_reward",
          "purchase",
          "admin_add",
          "admin_remove",
          "exchange",
          "daily_reward",
          "voice_reward",
          "other",
        ],
      },

      source: {
        type: String,
        trim: true,
      },

      sourceId: {
        type: String,
        trim: true,
      },

      description: {
        type: String,
        trim: true,
      },
    },
    {
      timestamps: true,
    }
  );

/*
 * ============================================================
 * PROTECTION CONTRE LES DOUBLES RÉCOMPENSES
 * ============================================================
 *
 * Une même récompense économique ne peut être créée
 * deux fois pour un même utilisateur.
 */

economyTransactionSchema.index(
  {
    userId: 1,
    type: 1,
    source: 1,
    sourceId: 1,
    currencyId: 1,
  },
  {
    unique: true,

    partialFilterExpression: {
      type: {
        $in: [
          "quest_reward",
          "achievement_reward",
          "daily_reward",
          "voice_reward",
        ],
      },

      sourceId: {
        $exists: true,
      },
    },
  }
);

export const EconomyTransaction =
  mongoose.model<EconomyTransactionDocument>(
    "EconomyTransaction",
    economyTransactionSchema
  );