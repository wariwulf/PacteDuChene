import mongoose, { Schema } from "mongoose";
import {
  QuestDocument,
  QuestObjective,
  UserQuestDocument,
} from "./quests.types";

const questObjectiveSchema = new Schema<QuestObjective>(
  {
    objectiveId: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    target: { type: Number, required: true, min: 1 },
    eventType: { type: String, trim: true },
    eventTargetId: { type: String, trim: true },
    requiresProof: { type: Boolean, default: false },
  },
  { _id: false }
);

const questStepSchema = new Schema(
  {
    stepId: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    imageUrl: { type: String, trim: true },
    difficulty: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
      max: 5,
    },
    objectives: {
      type: [questObjectiveSchema],
      required: true,
      default: [],
    },
  },
  { _id: false }
);

const questSchema = new Schema<QuestDocument>(
  {
    questId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    imageUrl: { type: String, trim: true },
    difficulty: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
      max: 5,
    },
    prerequisites: { type: [String], default: [] },
    steps: { type: [questStepSchema], default: [] },
    objectives: {
      type: [questObjectiveSchema],
      required: true,
      default: [],
    },
    rewardXp: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    rewardCurrencyId: { type: String, trim: true },
    rewardAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    rewardAchievementId: { type: String, trim: true },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const userQuestObjectiveSchema = new Schema(
  {
    objectiveId: { type: String, required: true },
    current: { type: Number, required: true, default: 0, min: 0 },
    validationStatus: {
      type: String,
      enum: [
        "not_required",
        "not_submitted",
        "pending",
        "approved",
        "rejected",
      ],
      default: "not_required",
    },
    lastSubmissionId: {
      type: Schema.Types.ObjectId,
      ref: "QuestSubmission",
    },
    validationMessage: {
      type: String,
      trim: true,
    },
    validatedAt: Date,
  },
  { _id: false }
);

const userQuestSchema = new Schema<UserQuestDocument>(
  {
    userId: { type: String, required: true, index: true },
    questId: { type: String, required: true, index: true },
    objectives: {
      type: [userQuestObjectiveSchema],
      required: true,
      default: [],
    },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },
    completionProcessing: { type: Boolean, default: false },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

userQuestSchema.index(
  { userId: 1, questId: 1 },
  { unique: true }
);

export const Quest = mongoose.model<QuestDocument>(
  "Quest",
  questSchema
);

export const UserQuest = mongoose.model<UserQuestDocument>(
  "UserQuest",
  userQuestSchema
);
