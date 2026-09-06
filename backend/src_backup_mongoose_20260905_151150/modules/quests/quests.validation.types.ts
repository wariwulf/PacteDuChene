
export type SubmissionStatus = "pending" | "approved" | "rejected";

export interface SubmissionAttachment {
  type: "image" | "video" | "audio";
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface QuestSubmissionDocument {
  _id?: string;
  userId: string;
  questId: string;
  objectiveId: string;
  message: string;
  attachments: SubmissionAttachment[];
  status: SubmissionStatus;
  adminResponse?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
