"use client";

import { useEffect, useState } from "react";

import {
  createLevel,
  deleteLevel,
  getLevels,
  updateLevel,
} from "@/services/levels.service";

import { getMembers } from "@/services/members.service";

import type {
  CreateLevelData,
  LevelDefinition,
  UpdateLevelData,
} from "@/types/levels.types";

import LevelForm from "./LevelForm";
import MemberLevelManager from "./MemberLevelManager";

interface Member {
  profile: {
    id: string;
    username: string;
    displayName?: string;
    email: string;
    role: string;
    status: string;
  };
}

export default function LevelsAdmin() {
  // ============================================================
  // NIVEAUX
  // ============================================================

  const [levels, setLevels] = useState<
    LevelDefinition[]
  >([]);

  const [levelsLoading, setLevelsLoading] =
    useState(true);

  // ============================================================
  // MEMBRES
  // ============================================================

  const [members, setMembers] = useState<Member[]>(
    []
  );

  const [membersLoading, setMembersLoading] =
    useState(true);

  // ============================================================
  // FORMULAIRE
  // ============================================================

  const [showForm, setShowForm] =
    useState(false);

  const [editingLevel, setEditingLevel] =
    useState<LevelDefinition | null>(null);

  const [formLoading, setFormLoading] =
    useState(false);

  // ============================================================
  // ERREURS
  // ============================================================

  const [error, setError] =
    useState("");

  // ============================================================
  // CHARGEMENT DES NIVEAUX
  // ============================================================

  async function loadLevels() {
    try {
      setLevelsLoading(true);
      setError("");

      const data = await getLevels();

      setLevels(data);
    } catch (error) {
      console.error(
        "Erreur récupération niveaux :",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Impossible de récupérer les niveaux."
      );
    } finally {
      setLevelsLoading(false);
    }
  }

  // ============================================================
  // CHARGEMENT DES MEMBRES
  // ============================================================

  async function loadMembers() {
    try {
      setMembersLoading(true);

      const data = await getMembers();

      setMembers(data);
    } catch (error) {
      console.error(
        "Erreur récupération membres :",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Impossible de récupérer les membres."
      );
    } finally {
      setMembersLoading(false);
    }
  }

  // ============================================================
  // CHARGEMENT INITIAL
  // ============================================================

  useEffect(() => {
    loadLevels();
    loadMembers();
  }, []);

  // ============================================================
  // OUVRIR CRÉATION
  // ============================================================

  function handleOpenCreate() {
    setError("");
    setEditingLevel(null);
    setShowForm(true);
  }

  // ============================================================
  // OUVRIR MODIFICATION
  // ============================================================

  function handleOpenEdit(
    level: LevelDefinition
  ) {
    setError("");
    setShowForm(false);
    setEditingLevel(level);
  }

  // ============================================================
  // FERMER FORMULAIRE
  // ============================================================

  function handleCancelForm() {
    setShowForm(false);
    setEditingLevel(null);
    setError("");
  }

  // ============================================================
  // CRÉER UN NIVEAU
  // ============================================================

  async function handleCreateLevel(
    data: CreateLevelData
  ) {
    try {
      setFormLoading(true);
      setError("");

      await createLevel(data);

      setShowForm(false);

      await loadLevels();
    } catch (error) {
      console.error(
        "Erreur création niveau :",
        error
      );

      throw error;
    } finally {
      setFormLoading(false);
    }
  }

  // ============================================================
  // MODIFIER UN NIVEAU
  // ============================================================

  async function handleUpdateLevel(
    data: UpdateLevelData
  ) {
    if (!editingLevel) {
      return;
    }

    try {
      setFormLoading(true);
      setError("");

      await updateLevel(
        editingLevel.level,
        data
      );

      setEditingLevel(null);

      await loadLevels();
    } catch (error) {
      console.error(
        "Erreur modification niveau :",
        error
      );

      throw error;
    } finally {
      setFormLoading(false);
    }
  }

  // ============================================================
  // SUPPRIMER UN NIVEAU
  // ============================================================

  async function handleDeleteLevel(
    level: number
  ) {
    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer le niveau ${level} ?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteLevel(level);

      await loadLevels();
    } catch (error) {
      console.error(
        "Erreur suppression niveau :",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Impossible de supprimer le niveau."
      );
    }
  }

  // ============================================================
  // CHARGEMENT GLOBAL
  // ============================================================

  if (
    levelsLoading ||
    membersLoading
  ) {
    return (
      <main>
        <h1>
          Administration des niveaux
        </h1>

        <p>
          Chargement des données...
        </p>
      </main>
    );
  }

  // ============================================================
  // AFFICHAGE
  // ============================================================

  return (
    <main>
      {/* ======================================================
          EN-TÊTE
      ======================================================= */}

      <header>
        <div>
          <h1>
            Administration des niveaux
          </h1>

          <p>
            Configurez le système de progression
            du Pacte du Chêne.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          disabled={formLoading}
        >
          Ajouter un niveau
        </button>
      </header>

      {/* ======================================================
          ERREUR
      ======================================================= */}

      {error && (
        <div role="alert">
          {error}
        </div>
      )}

      {/* ======================================================
          FORMULAIRE DE CRÉATION
      ======================================================= */}

      {showForm && (
        <section>
          <LevelForm
            onSubmit={async (data) => {
              await handleCreateLevel(
                data as CreateLevelData
              );
            }}
            onCancel={handleCancelForm}
          />
        </section>
      )}

      {/* ======================================================
          FORMULAIRE DE MODIFICATION
      ======================================================= */}

      {editingLevel && (
        <section>
          <LevelForm
            level={editingLevel}
            onSubmit={async (data) => {
              await handleUpdateLevel(
                data as UpdateLevelData
              );
            }}
            onCancel={handleCancelForm}
          />
        </section>
      )}

      {/* ======================================================
          LISTE DES NIVEAUX
      ======================================================= */}

      <section>
        <div>
          <h2>
            Niveaux configurés
          </h2>

          <p>
            {levels.length} niveau
            {levels.length > 1 ? "x" : ""} configuré
            {levels.length > 1 ? "s" : ""}.
          </p>
        </div>

        {levels.length === 0 ? (
          <p>
            Aucun niveau configuré.
          </p>
        ) : (
          <div>
            {levels.map((level) => (
              <article
                key={level._id}
              >
                {/* -----------------------------------------
                    INFORMATIONS
                ------------------------------------------ */}

                <div>
                  <strong>
                    Niveau {level.level}
                  </strong>

                  <h3>
                    {level.name}
                  </h3>

                  {level.description && (
                    <p>
                      {level.description}
                    </p>
                  )}
                </div>

                {/* -----------------------------------------
                    XP / ÉTAT
                ------------------------------------------ */}

                <div>
                  <span>
                    {level.requiredXp} XP
                  </span>

                  <span>
                    {level.enabled
                      ? "Actif"
                      : "Désactivé"}
                  </span>
                </div>

                {/* -----------------------------------------
                    ACTIONS
                ------------------------------------------ */}

                <div>
                  <button
                    type="button"
                    onClick={() =>
                      handleOpenEdit(level)
                    }
                    disabled={formLoading}
                  >
                    Modifier
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDeleteLevel(
                        level.level
                      )
                    }
                    disabled={formLoading}
                  >
                    Supprimer
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ======================================================
          GESTION DES MEMBRES
      ======================================================= */}

      <section>
        <MemberLevelManager />
      </section>
    </main>
  );
}