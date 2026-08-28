import mongoose, { Schema } from "mongoose";

export type NotificationType =
  | "QUEST_SUBMISSION_CREATED"
  | "QUEST_SUBMISSION_APPROVED"
  | "QUEST_SUBMISSION_REJECTED"
  | "ACHIEVEMENT_SUBMISSION_CREATED"
  | "ACHIEVEMENT_SUBMISSION_APPROVED"
  | "ACHIEVEMENT_SUBMISSION_REJECTED"
  | "QUEST_COMPLETED"
  | "SYSTEM";

export interface NotificationDocument {
  _id?: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  readAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const schema =
  new Schema<NotificationDocument>(
    {
      recipientId: {
        type: String,
        required: true,
        index: true,
      },

      type: {
        type: String,
        enum: [
          "QUEST_SUBMISSION_CREATED",
          "QUEST_SUBMISSION_APPROVED",
            "QUEST_SUBMISSION_REJECTED",
            "ACHIEVEMENT_SUBMISSION_CREATED",
          "ACHIEVEMENT_SUBMISSION_APPROVED",
          "ACHIEVEMENT_SUBMISSION_REJECTED",
          "QUEST_COMPLETED",
          "SYSTEM",
        ],
        required: true,
      },

      title: {
        type: String,
        required: true,
        trim: true,
      },

      message: {
        type: String,
        required: true,
        trim: true,
      },

      data: {
        type: Schema.Types.Mixed,
      },

      read: {
        type: Boolean,
        default: false,
        index: true,
      },

      readAt: Date,
    },
    {
      timestamps: true,
    }
  );

export const Notification =
  mongoose.model<NotificationDocument>(
    "Notification",
    schema
  );
