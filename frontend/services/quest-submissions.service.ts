import { apiFetch } from "@/lib/api/client";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

export interface QuestSubmissionAttachment {
  type: "image" | "video" | "audio";
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface QuestSubmission {
  _id: string;
  userId: string;
  questId: string;
  objectiveId: string;
  message: string;
  attachments: QuestSubmissionAttachment[];
  status: "pending" | "approved" | "rejected";
  adminResponse?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

type SubmissionResponse = {
  success: boolean;
  data: {
    submission: QuestSubmission;
  };
  message?: string;
};

type SubmissionsResponse = {
  success: boolean;
  data: {
    submissions: QuestSubmission[];
  };
  message?: string;
};

export async function submitQuestObjective(
  userId: string,
  questId: string,
  objectiveId: string,
  message: string,
  files: File[]
) {
  const formData = new FormData();

  formData.append(
    "message",
    message
  );

  for (const file of files.slice(0, 5)) {
    formData.append(
      "files",
      file
    );
  }

  const response =
    await fetch(
      `${API_URL}/quests/user/${encodeURIComponent(
        userId
      )}/${encodeURIComponent(
        questId
      )}/objectives/${encodeURIComponent(
        objectiveId
      )}/submit`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
      }
    );

  const payload =
    (await response
      .json()
      .catch(() => ({}))) as Partial<
      SubmissionResponse
    >;

  if (
    !response.ok ||
    payload.success === false
  ) {
    throw new Error(
      payload.message ||
        `Erreur serveur (${response.status})`
    );
  }

  if (!payload.data?.submission) {
    throw new Error(
      "La soumission a été créée mais la réponse du serveur est invalide."
    );
  }

  return payload.data.submission;
}

export async function getPendingQuestSubmissions() {
  const response =
    await apiFetch<SubmissionsResponse>(
      "/quests/admin/submissions"
    );

  if (!response.success) {
    throw new Error(
      response.message ||
        "Impossible de récupérer les demandes."
    );
  }

  return response.data.submissions;
}

export async function getMyQuestSubmissions(
  questId?: string
) {
  const query = questId
    ? `?questId=${encodeURIComponent(
        questId
      )}`
    : "";

  const response =
    await apiFetch<SubmissionsResponse>(
      `/quests/submissions/mine${query}`
    );

  if (!response.success) {
    throw new Error(
      response.message ||
        "Impossible de récupérer vos preuves."
    );
  }

  return response.data.submissions;
}

export async function reviewQuestSubmission(
  submissionId: string,
  status: "approved" | "rejected",
  responseMessage = ""
) {
  const response =
    await apiFetch<SubmissionResponse>(
      `/quests/admin/submissions/${encodeURIComponent(
        submissionId
      )}/review`,
      {
        method: "POST",
        body: JSON.stringify({
          status,
          response: responseMessage,
        }),
      }
    );

  if (!response.success) {
    throw new Error(
      response.message ||
        "Impossible de traiter la demande."
    );
  }

  return response.data.submission;
}
