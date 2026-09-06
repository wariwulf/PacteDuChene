"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";

import {
  createLevel,
  deleteLevel,
  getLevels,
  updateLevel,
  resetAllUserLevels,
} from "@/services/levels.service";

import type {
  CreateLevelData,
  LevelDefinition,
  UpdateLevelData,
} from "@/types/levels.types";

import LevelForm from "./LevelForm";
import LevelList from "./LevelList";
import MemberLevelManager from "./MemberLevelManager";

export default function LevelsAdmin() {
  const { user } = useAuth();
  const isOwner = user?.role === "OWNER";

  const [levels, setLevels] = useState<LevelDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLevel, setEditingLevel] = useState<LevelDefinition | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadLevels() {
    try {
      setLoading(true);
      setError("");
      setLevels(await getLevels());
    } catch (err) {
      console.error("Erreur récupération niveaux :", err);
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de récupérer les niveaux."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadLevels();
  }, []);

  function openCreate() {
    setError("");
    setEditingLevel(null);
    setShowForm(true);
  }

  function openEdit(level: LevelDefinition) {
    setError("");
    setShowForm(false);
    setEditingLevel(level);
  }

  function closeForm() {
    setShowForm(false);
    setEditingLevel(null);
    setError("");
  }

  async function handleCreate(data: CreateLevelData) {
    try {
      setSaving(true);
      setError("");
      await createLevel(data);
      closeForm();
      await loadLevels();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de créer le niveau.");
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(data: UpdateLevelData) {
    if (!editingLevel) return;

    try {
      setSaving(true);
      setError("");
      await updateLevel(editingLevel.level, data);
      closeForm();
      await loadLevels();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de modifier le niveau.");
      throw err;
    } finally {
      setSaving(false);
    }
  }


  async function handleResetAllProgression() {
    if (!isOwner) return;

    const firstConfirmation = window.confirm(
      "ATTENTION : cette opération va remettre l'XP et le niveau de TOUS les membres à zéro et effacer leur historique de progression. Les niveaux configurés eux-mêmes ne seront pas supprimés.\n\nVoulez-vous vraiment continuer ?"
    );

    if (!firstConfirmation) return;

    const secondConfirmation = window.prompt(
      'Pour confirmer définitivement, saisissez exactement : REMISE À ZÉRO'
    );

    if (secondConfirmation !== "REMISE À ZÉRO") {
      setError("Remise à zéro annulée : confirmation incorrecte.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const count = await resetAllUserLevels();
      setError("");
      window.alert(
        `${count} progression(s) ont été remises à zéro.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de remettre les progressions à zéro."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(level: number) {
    const target = levels.find((item) => item.level === level);
    const name = target?.name ? ` — ${target.name}` : "";

    const confirmed = window.confirm(
      `Supprimer le niveau ${level}${name} ?\n\nCette action supprime la définition de ce palier. Vérifiez qu'il n'est plus nécessaire avant de continuer.`
    );

    if (!confirmed) return;

    try {
      setError("");
      await deleteLevel(level);
      await loadLevels();
    } catch (err) {
      console.error("Erreur suppression niveau :", err);
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de supprimer le niveau."
      );
    }
  }

  return (
    <main className="space-y-10 pb-12">
      <header className="rounded-2xl border border-amber-800/50 bg-[#071a12]/90 p-7 shadow-[0_15px_40px_rgba(0,0,0,.2)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.22em] text-amber-500">
              Administration · Progression
            </p>
            <h1 className="mt-2 text-3xl font-bold text-[#f2ead2]">
              Les rangs du Pacte
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-300/75">
              Configurez les paliers d'expérience et gérez la progression individuelle des membres.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreate}
            disabled={saving}
            className="rounded-xl border border-amber-600 bg-amber-700/90 px-5 py-3 font-bold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            + Ajouter un niveau
          </button>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-900/80 bg-red-950/30 p-4 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      {(showForm || editingLevel) && (
        <section>
          <LevelForm
            level={editingLevel}
            onSubmit={async (data) => {
              if (editingLevel) {
                await handleUpdate(data as UpdateLevelData);
              } else {
                await handleCreate(data as CreateLevelData);
              }
            }}
            onCancel={closeForm}
          />
        </section>
      )}

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-amber-500">
              Paliers
            </p>
            <h2 className="mt-1 text-2xl font-bold text-[#f2ead2]">
              Niveaux configurés
            </h2>
          </div>
          {!loading && (
            <p className="text-sm text-emerald-400">
              {levels.length} niveau{levels.length > 1 ? "x" : ""} configuré{levels.length > 1 ? "s" : ""}
            </p>
          )}
        </div>

        <LevelList
          levels={levels}
          loading={loading}
          disabled={saving}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      </section>


      {isOwner && (
        <section className="rounded-2xl border border-red-900/80 bg-red-950/20 p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.2em] text-red-400">
                Propriétaire uniquement
              </p>
              <h2 className="mt-1 text-xl font-bold text-red-200">
                Remise à zéro globale
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-red-300/75">
                Remet l'XP et la progression de tous les membres à zéro et efface leur historique de progression.
                Les définitions des niveaux restent intactes.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void handleResetAllProgression()}
              disabled={saving}
              className="shrink-0 rounded-xl border border-red-700 bg-red-950/50 px-5 py-3 font-bold text-red-200 transition hover:bg-red-900/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ⚠ Remettre tout à zéro
            </button>
          </div>
        </section>
      )}

      <section className="border-t border-emerald-900/60 pt-10">
        <MemberLevelManager />
      </section>
    </main>
  );
}
