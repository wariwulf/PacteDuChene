import { apiFetch } from "@/lib/api/client";

import type {
  CreateQuestData,
  QuestCompletionResponse,
  QuestDefinition,
  QuestResponse,
  QuestsResponse,
  UpdateQuestProgressData,
  UserQuest,
  UserQuestResponse,
  UserQuestsResponse,
} from "@/types/quests.types";

/* =========================================================
   QUÊTES
   ========================================================= */

/**
 * Récupère toutes les quêtes.
 */
export async function getQuests(): Promise<QuestDefinition[]> {
  const response =
    await apiFetch<QuestsResponse>("/quests");

  if (!response.success) {
    throw new Error(
      "Impossible de récupérer les quêtes."
    );
  }

  return response.data.quests;
}


/**
 * Récupère les quêtes supprimées (administration).
 */
export async function getDeletedQuests(): Promise<QuestDefinition[]> {
  const response =
    await apiFetch<QuestsResponse>("/quests/admin/deleted");

  if (!response.success) {
    throw new Error(
      response.message ??
        "Impossible de récupérer les quêtes supprimées."
    );
  }

  return response.data.quests;
}

/**
 * Restaure une quête supprimée.
 */
export async function restoreQuest(
  questId: string
): Promise<QuestDefinition> {
  const response =
    await apiFetch<QuestResponse>(
      `/quests/admin/${questId}/restore`,
      { method: "POST" }
    );

  if (!response.success) {
    throw new Error(
      response.message ??
        "Impossible de restaurer la quête."
    );
  }

  return response.data.quest;
}

/**
 * Récupère une quête.
 */
export async function getQuest(
  questId: string
): Promise<QuestDefinition> {
  const response =
    await apiFetch<QuestResponse>(
      `/quests/${questId}`
    );

  if (!response.success) {
    throw new Error(
      "Impossible de récupérer la quête."
    );
  }

  return response.data.quest;
}

/**
 * Crée une quête.
 */
export async function createQuest(
  data: CreateQuestData
): Promise<QuestDefinition> {
  const response =
    await apiFetch<QuestResponse>(
      "/quests",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );

  if (!response.success) {
    throw new Error(
      "Impossible de créer la quête."
    );
  }

  return response.data.quest;
}

/**
 * Modifie une quête.
 */
export async function updateQuest(
  questId: string,
  data: Partial<CreateQuestData>
): Promise<QuestDefinition> {
  const response =
    await apiFetch<QuestResponse>(
      `/quests/${questId}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );

  if (!response.success) {
    throw new Error(
      "Impossible de modifier la quête."
    );
  }

  return response.data.quest;
}

/**
 * Supprime une quête.
 */
export async function deleteQuest(
  questId: string
): Promise<void> {
  const response =
    await apiFetch<{
      success: boolean;
      message?: string;
    }>(
      `/quests/${questId}`,
      {
        method: "DELETE",
      }
    );

  if (!response.success) {
    throw new Error(
      response.message ??
        "Impossible de supprimer la quête."
    );
  }
}


/* =========================================================
   QUÊTES UTILISATEUR
   ========================================================= */

/**
 * Récupère les quêtes d'un membre.
 */
export async function getUserQuests(
  userId: string
): Promise<UserQuest[]> {
  const response =
    await apiFetch<UserQuestsResponse>(
      `/quests/user/${userId}`
    );

  if (!response.success) {
    throw new Error(
      "Impossible de récupérer vos quêtes."
    );
  }

  return response.data.quests;
}

/**
 * Démarre une quête.
 */
export async function startQuest(
  userId: string,
  questId: string
): Promise<UserQuest> {
  const response =
    await apiFetch<UserQuestResponse>(
      `/quests/user/${userId}/${questId}/start`,
      {
        method: "POST",
      }
    );

  if (!response.success) {
    throw new Error(
      "Impossible de démarrer la quête."
    );
  }

  return response.data.quest;
}

/**
 * Met à jour la progression d'un objectif.
 */
export async function updateQuestProgress(
  userId: string,
  questId: string,
  data: UpdateQuestProgressData
): Promise<UserQuest> {
  const response =
    await apiFetch<UserQuestResponse>(
      `/quests/user/${userId}/${questId}/progress`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );

  if (!response.success) {
    throw new Error(
      "Impossible de mettre à jour la progression."
    );
  }

  return response.data.quest;
}

/**
 * Termine une quête.
 */
export async function completeQuest(
  userId: string,
  questId: string
): Promise<QuestCompletionResponse["data"]> {
  const response =
    await apiFetch<QuestCompletionResponse>(
      `/quests/user/${userId}/${questId}/complete`,
      {
        method: "POST",
      }
    );

  if (!response.success) {
    throw new Error(
      "Impossible de terminer la quête."
    );
  }

  return response.data;
}
/**
 * Envoie l'image principale d'une quête après sa création ou sa modification.
 */
export async function uploadQuestImage(
  questId: string,
  file: File
): Promise<QuestDefinition> {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(
    `${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/$/, "")}/quests/${encodeURIComponent(questId)}/image`,
    {
      method: "POST",
      credentials: "include",
      body: formData,
    }
  );

  const payload = (await response.json().catch(() => ({}))) as QuestResponse;

  if (!response.ok || payload.success === false || !payload.data?.quest) {
    throw new Error(
      payload.message ||
        `Impossible d'envoyer l'image de la quête (${response.status}).`
    );
  }

  return payload.data.quest;
}

/**
 * Envoie l'image d'une étape après la création ou la modification de la quête.
 */
export async function uploadQuestStepImage(
  questId: string,
  stepId: string,
  file: File
): Promise<QuestDefinition> {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(
    `${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/$/, "")}/quests/${encodeURIComponent(questId)}/steps/${encodeURIComponent(stepId)}/image`,
    {
      method: "POST",
      credentials: "include",
      body: formData,
    }
  );

  const payload = (await response.json().catch(() => ({}))) as QuestResponse;

  if (!response.ok || payload.success === false || !payload.data?.quest) {
    throw new Error(
      payload.message ||
        `Impossible d'envoyer l'image de l'étape (${response.status}).`
    );
  }

  return payload.data.quest;
}
