import mongoose, { Document, Schema } from "mongoose";
import { UserRole } from "../../common/constants/roles";
import {
  UserDocument,
  UserProfile,
  UserDiscord,
  UserPaxDei,
  UserEconomy,
  UserStatus,
} from "./user.types";

export type UserModelDocument = UserDocument & Document;

const profileSchema = new Schema<UserProfile>(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 32,
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: 64,
    },
    avatar: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const discordSchema = new Schema<UserDiscord>(
  {
    discordId: {
      type: String,
      sparse: true,
      index: true,
    },
    username: {
      type: String,
      trim: true,
    },
    linked: {
      type: Boolean,
      default: false,
    },
    lastSyncAt: {
      type: Date,
    },
  },
  { _id: false }
);

const paxDeiSchema = new Schema<UserPaxDei>(
  {
    characterName: {
      type: String,
      trim: true,
      maxlength: 64,
    },
    level: {
      type: Number,
      min: 0,
    },
    lastSyncAt: {
      type: Date,
    },
  },
  { _id: false }
);

const economySchema = new Schema<UserEconomy>(
  {
    balances: {
      type: Map,
      of: {
        type: Number,
        min: 0,
      },
      default: () => new Map(),
    },
  },
  { _id: false }
);

const userSchema = new Schema<UserModelDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.PLAYER,
      required: true,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "SUSPENDED", "DELETED"] satisfies UserStatus[],
      default: "ACTIVE",
      required: true,
    },

    mustChangePassword: {
      type: Boolean,
      default: false,
      required: true,
    },

    profile: {
      type: profileSchema,
      required: true,
    },

    discord: {
      type: discordSchema,
      default: () => ({
        linked: false,
      }),
    },

    paxDei: {
      type: paxDeiSchema,
      default: () => ({}),
    },

    economy: {
      type: economySchema,
      default: () => ({
        balances: new Map(),
      }),
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<UserModelDocument>("User", userSchema);
