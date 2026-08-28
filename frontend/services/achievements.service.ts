import { apiFetch } from "../lib/api/client";
import type {
  Achievement,
  AchievementLevel,
  AchievementSubmission,
  UserAchievement,
} from "../types/achievements.types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

/* =========================================================
   TYPES DE RÉPONSES API
========================================================= */

interface AchievementsResponse {
  success: boolean;
  data: {
    achievements: Achievement[];
  };
  message?: string;
}

interface UserAchievementsResponse {
  success: boolean;
  data: {
    achievements: UserAchievement[];
  };
  message?: string;
}

interface SubmissionResponse {
  success: boolean;
  data: {
    submission: AchievementSubmission;
  };
  message?: string;
}

interface SubmissionsResponse {
  success: boolean;
  data: {
    submissions: AchievementSubmission[];
  };
  message?: string;
}

interface FeaturedResponse {
  success: boolean;
  data: {
    achievements: UserAchievement[];
  };
  message?: string;
}

/* =========================================================
   PAYLOADS
========================================================= */

export interface AchievementPayload {
  achievementId: string;
  name: string;
  description?: string;
  level: AchievementLevel;
  rewardCurrencyId?: string;
  rewardAmount: number;
  enabled: boolean;
}

/* =========================================================
   EXPLOITS
========================================================= */

/**
 * Récupère tous les exploits disponibles.
 */
export async function getAchievements(): Promise<Achievement[]> {
  const response = await apiFetch<AchievementsResponse>(
    "/achievements"
  );

  if (!response.success) {
    throw new Error(
      response.message ||
        "Impossible de récupérer les exploits."
    );
  }

  return response.data.achievements;
}

/**
 * Récupère un exploit par son identifiant.
 */
export async function getAchievement(
  achievementId: string
): Promise<Achievement> {
  const response = await apiFetch<{
    success: boolean;
    data: {
      achievement: Achievement;
    };
    message?: string;
  }>(
    `/achievements/${encodeURIComponent(achievementId)}`
  );

  if (!response.success) {
    throw new Error(
      response.message ||
        "Impossible de récupérer l'exploit."
    );
  }

  return response.data.achievement;
}

/**
 * Récupère les exploits débloqués par un membre.
 */
export async function getUserAchievements(
  userId: string
): Promise<UserAchievement[]> {
  const response =
    await apiFetch<UserAchievementsResponse>(
      `/achievements/user/${encodeURIComponent(userId)}`
    );

  if (!response.success) {
    throw new Error(
      response.message ||
        "Impossible de récupérer les exploits du membre."
    );
  }

  return response.data.achievements;
}

/* =========================================================
   EXPLOITS MIS EN AVANT
========================================================= */

/**
 * Définit les exploits que le membre souhaite mettre en avant.
 */
export async function setMyFeaturedAchievements(
  achievementIds: string[]
): Promise<UserAchievement[]> {
  const response =
    await apiFetch<FeaturedResponse>(
      "/achievements/user/me/featured",
      {
        method: "PUT",
        body: JSON.stringify({
          achievementIds,
        }),
      }
    );

  if (!response.success) {
    throw new Error(
      response.message ||
        "Impossible de modifier vos exploits mis en avant."
    );
  }

  return response.data.achievements;
}

/* =========================================================
   DEMANDES DE VALIDATION
========================================================= */

/**
 * Récupère les demandes de validation du membre.
 */
export async function getMyAchievementSubmissions(
  userId: string,
  achievementId?: string
): Promise<AchievementSubmission[]> {
  const query = achievementId
    ? `?achievementId=${encodeURIComponent(achievementId)}`
    : "";

  const response =
    await apiFetch<SubmissionsResponse>(
      `/achievements/user/${encodeURIComponent(
        userId
      )}/submissions${query}`
    );

  if (!response.success) {
    throw new Error(
      response.message ||
        "Impossible de récupérer vos demandes de validation."
    );
  }

  return response.data.submissions;
}

/**
 * Envoie une demande de validation d'exploit.
 */
export async function submitAchievement(
  userId: string,
  achievementId: string,
  message: string,
  files: File[]
): Promise<AchievementSubmission> {
  const formData = new FormData();

  formData.append("message", message);

  for (const file of files.slice(0, 5)) {
    formData.append("files", file);
  }

  const response = await fetch(
    `${API_URL}/achievements/user/${encodeURIComponent(
      userId
    )}/${encodeURIComponent(achievementId)}/submit`,
    {
      method: "POST",
      credentials: "include",
      body: formData,
    }
  );

  const payload =
    (await response.json().catch(() => ({}))) as Partial<
      SubmissionResponse
    >;

  if (!response.ok || payload.success === false) {
    throw new Error(
      payload.message ||
        `Erreur serveur (${response.status})`
    );
  }

  if (!payload.data?.submission) {
    throw new Error(
      "La réponse du serveur est invalide."
    );
  }

  return payload.data.submission;
}

/* =========================================================
   ADMINISTRATION
========================================================= */

/**
 * Récupère toutes les demandes de validation en attente.
 */
export async function getPendingAchievementSubmissions(): Promise<
  AchievementSubmission[]
> {
  const response =
    await apiFetch<SubmissionsResponse>(
      "/achievements/admin/submissions"
    );

  if (!response.success) {
    throw new Error(
      response.message ||
        "Impossible de récupérer les demandes de validation."
    );
  }

  return response.data.submissions;
}

/**
 * Traite une demande de validation.
 */
export async function reviewAchievementSubmission(
  submissionId: string,
  status: "approved" | "rejected",
  responseMessage = ""
): Promise<AchievementSubmission> {
  const response =
    await apiFetch<SubmissionResponse>(
      `/achievements/admin/submissions/${encodeURIComponent(
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
        "Impossible de traiter la demande de validation."
    );
  }

  return response.data.submission;
}

/* =========================================================
   CRÉATION / MODIFICATION
========================================================= */

/**
 * Crée un nouvel exploit.
 */
export async function createAchievement(
  payload: AchievementPayload
): Promise<Achievement> {
  const response =
    await apiFetch<{
      success: boolean;
      data: {
        achievement: Achievement;
      };
      message?: string;
    }>("/achievements", {
      method: "POST",
      body: JSON.stringify(payload),
    });

  if (!response.success) {
    throw new Error(
      response.message ||
        "Impossible de créer l'exploit."
    );
  }

  return response.data.achievement;
}

/**
 * Modifie un exploit existant.
 */
export async function updateAchievement(
  achievementId: string,
  payload: Partial<
    Omit<AchievementPayload, "achievementId">
  >
): Promise<Achievement> {
  const response =
    await apiFetch<{
      success: boolean;
      data: {
        achievement: Achievement;
      };
      message?: string;
    }>(
      `/achievements/${encodeURIComponent(
        achievementId
      )}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      }
    );

  if (!response.success) {
    throw new Error(
      response.message ||
        "Impossible de modifier l'exploit."
    );
  }

  return response.data.achievement;
}