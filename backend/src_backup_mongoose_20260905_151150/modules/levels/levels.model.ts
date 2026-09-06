import {
  Document,
  Model,
  Schema,
  model,
} from "mongoose";

import type {
  LevelAction,
  LevelSource,
} from "./levels.types";

/*
 * ============================================================
 * DÉFINITION D'UN NIVEAU
 * ============================================================
 */

export interface LevelDefinitionDocument
  extends Document {
  level: number;
  name: string;
  description?: string;
  requiredXp: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const levelDefinitionSchema =
  new Schema<LevelDefinitionDocument>(
    {
      level: {
        type: Number,
        required: true,
        unique: true,
        min: 1,
      },

      name: {
        type: String,
        required: true,
        trim: true,
      },

      description: {
        type: String,
        trim: true,
      },

      requiredXp: {
        type: Number,
        required: true,
        min: 0,
      },

      enabled: {
        type: Boolean,
        default: true,
      },
    },
    {
      timestamps: true,
    }
  );

/*
 * ============================================================
 * HISTORIQUE DU LEVELING
 * ============================================================
 */

export interface LevelHistoryDocument {
  action: LevelAction;

  amount?: number;

  source: LevelSource;

  /**
   * Identifiant unique de l'origine de la récompense.
   *
   * Exemple :
   * test-premier-serment
   */
  sourceId?: string;

  adminUserId?: string;

  reason?: string;

  previousXp: number;

  newXp: number;

  previousLevel: number;

  newLevel: number;

  createdAt: Date;
}

const levelHistorySchema =
  new Schema<LevelHistoryDocument>(
    {
      action: {
        type: String,
        enum: [
          "XP_ADD",
          "XP_REMOVE",
          "XP_SET",
          "LEVEL_SET",
        ],
        required: true,
      },

      amount: {
        type: Number,
      },

      source: {
        type: String,
        enum: [
          "QUEST",
          "ACHIEVEMENT",
          "ADMIN",
        ],
        required: true,
      },

      sourceId: {
        type: String,
        trim: true,
      },

      adminUserId: {
        type: String,
      },

      reason: {
        type: String,
      },

      previousXp: {
        type: Number,
        required: true,
      },

      newXp: {
        type: Number,
        required: true,
      },

      previousLevel: {
        type: Number,
        required: true,
      },

      newLevel: {
        type: Number,
        required: true,
      },

      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      _id: false,
    }
  );

/*
 * ============================================================
 * NIVEAU UTILISATEUR
 * ============================================================
 */

export interface UserLevelDocument
  extends Document {
  userId: string;

  xp: number;

  level: number;

  history: LevelHistoryDocument[];

  createdAt: Date;

  updatedAt: Date;
}

const userLevelSchema =
  new Schema<UserLevelDocument>(
    {
      userId: {
        type: String,
        required: true,
        unique: true,
        index: true,
      },

      xp: {
        type: Number,
        default: 0,
        min: 0,
      },

      level: {
        type: Number,
        default: 1,
        min: 1,
      },

      history: {
        type: [levelHistorySchema],
        default: [],
      },
    },
    {
      timestamps: true,
    }
  );

/*
 * ============================================================
 * MODÈLES MONGOOSE
 * ============================================================
 */

export const LevelDefinition:
  Model<LevelDefinitionDocument> =
  model<LevelDefinitionDocument>(
    "LevelDefinition",
    levelDefinitionSchema
  );

export const UserLevel:
  Model<UserLevelDocument> =
  model<UserLevelDocument>(
    "UserLevel",
    userLevelSchema
  );