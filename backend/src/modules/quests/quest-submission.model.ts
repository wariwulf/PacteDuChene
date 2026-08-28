
import mongoose, { Schema } from "mongoose";
import {
  QuestSubmissionDocument,
  SubmissionAttachment,
} from "./quests.validation.types";

const attachmentSchema = new Schema<SubmissionAttachment>(
  {
    type: {
      type: String,
      enum: ["image", "video", "audio"],
      required: true,
    },
    url: { type: String, required: true, trim: true },
    originalName: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true, trim: true },
    size: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const questSubmissionSchema = new Schema<QuestSubmissionDocument>(
  {
    userId: { type: String, required: true, index: true },
    questId: { type: String, required: true, index: true },
    objectiveId: { type: String, required: true, index: true },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    attachments: { type: [attachmentSchema], default: [] },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    adminResponse: { type: String, trim: true, maxlength: 3000 },
    reviewedBy: { type: String, index: true },
    reviewedAt: Date,
  },
  { timestamps: true }
);

questSubmissionSchema.index({ userId: 1, questId: 1, objectiveId: 1, createdAt: -1 });

export const QuestSubmission =
  mongoose.model<QuestSubmissionDocument>(
    "QuestSubmission",
    questSubmissionSchema
  );
