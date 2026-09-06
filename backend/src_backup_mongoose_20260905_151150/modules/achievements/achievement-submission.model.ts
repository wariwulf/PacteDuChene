import mongoose, { Schema } from "mongoose";

export type AchievementSubmissionAttachmentType = "image" | "video" | "audio";

export interface AchievementSubmissionAttachment {
  type: AchievementSubmissionAttachmentType;
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface AchievementSubmissionDocument {
  _id?: string;
  userId: string;
  achievementId: string;
  message: string;
  attachments: AchievementSubmissionAttachment[];
  status: "pending" | "approved" | "rejected";
  adminResponse?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const attachmentSchema = new Schema<AchievementSubmissionAttachment>(
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

const achievementSubmissionSchema = new Schema<AchievementSubmissionDocument>(
  {
    userId: { type: String, required: true, index: true },
    achievementId: { type: String, required: true, index: true },
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

achievementSubmissionSchema.index({
  userId: 1,
  achievementId: 1,
  createdAt: -1,
});

export const AchievementSubmission =
  mongoose.model<AchievementSubmissionDocument>(
    "AchievementSubmission",
    achievementSubmissionSchema
  );
