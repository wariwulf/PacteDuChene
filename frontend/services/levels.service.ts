import { apiFetch } from "@/lib/api/client";

import type {
  CreateLevelData,
  LevelDefinition,
  LevelSetData,
  LevelsResponse,
  UpdateLevelData,
  UserLevel,
  UserLevelResponse,
  XpModificationData,
  XpSetData,
} from "@/types/levels.types";

/**
 * Récupère toutes les définitions de niveaux.
 */
export async function getLevels(): Promise<LevelDefinition[]> {
  const response =
    await apiFetch<LevelsResponse>("/levels");

  if (!response.success) {
    throw new Error(
      "Impossible de récupérer les niveaux."
    );
  }

  return response.data.levels;
}

/**
 * Récupère le niveau d'un utilisateur.
 */
export async function getUserLevel(
  userId: string
): Promise<UserLevel> {
  const response =
    await apiFetch<UserLevelResponse>(
      `/levels/user/${userId}`
    );

  if (!response.success) {
    throw new Error(
      "Impossible de récupérer le niveau du membre."
    );
  }

  return response.data.level;
}

/**
 * Ajoute de l'XP à un utilisateur.
 */
export async function addUserXp(
  userId: string,
  data: XpModificationData
): Promise<UserLevel> {
  const response =
    await apiFetch<UserLevelResponse>(
      `/levels/user/${userId}/xp/add`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );

  if (!response.success) {
    throw new Error(
      "Impossible d'ajouter l'XP."
    );
  }

  return response.data.level;
}

/**
 * Retire de l'XP à un utilisateur.
 */
export async function removeUserXp(
  userId: string,
  data: XpModificationData
): Promise<UserLevel> {
  const response =
    await apiFetch<UserLevelResponse>(
      `/levels/user/${userId}/xp/remove`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );

  if (!response.success) {
    throw new Error(
      "Impossible de retirer l'XP."
    );
  }

  return response.data.level;
}

/**
 * Définit directement l'XP d'un utilisateur.
 */
export async function setUserXp(
  userId: string,
  data: XpSetData
): Promise<UserLevel> {
  const response =
    await apiFetch<UserLevelResponse>(
      `/levels/user/${userId}/xp/set`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );

  if (!response.success) {
    throw new Error(
      "Impossible de définir l'XP."
    );
  }

  return response.data.level;
}

/**
 * Définit directement le niveau d'un utilisateur.
 */
export async function setUserLevel(
  userId: string,
  data: LevelSetData
): Promise<UserLevel> {
  const response =
    await apiFetch<UserLevelResponse>(
      `/levels/user/${userId}/level/set`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );

  if (!response.success) {
    throw new Error(
      "Impossible de définir le niveau."
    );
  }

  return response.data.level;
}

/**
 * Crée une nouvelle définition de niveau.
 */
export async function createLevel(
  data: CreateLevelData
): Promise<LevelDefinition> {
  const response =
    await apiFetch<{
      success: boolean;
      data: {
        level: LevelDefinition;
      };
    }>("/levels", {
      method: "POST",
      body: JSON.stringify(data),
    });

  if (!response.success) {
    throw new Error(
      "Impossible de créer le niveau."
    );
  }

  return response.data.level;
}

/**
 * Modifie une définition de niveau.
 */
export async function updateLevel(
  level: number,
  data: UpdateLevelData
): Promise<LevelDefinition> {
  const response =
    await apiFetch<{
      success: boolean;
      data: {
        level: LevelDefinition;
      };
    }>(`/levels/${level}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });

  if (!response.success) {
    throw new Error(
      "Impossible de modifier le niveau."
    );
  }

  return response.data.level;
}

/**
 * Supprime une définition de niveau.
 */
export async function deleteLevel(
  level: number
): Promise<void> {
  const response =
    await apiFetch<{
      success: boolean;
      message?: string;
    }>(`/levels/${level}`, {
      method: "DELETE",
    });

  if (!response.success) {
    throw new Error(
      response.message ??
        "Impossible de supprimer le niveau."
    );
  }
}