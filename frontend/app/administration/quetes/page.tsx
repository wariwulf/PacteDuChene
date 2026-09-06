"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  deleteQuest,
  getDeletedQuests,
  getQuests,
  restoreQuest,
} from "@/services/quests.service";
import QuestDifficulty from "@/components/admin/quests/QuestDifficulty";
import type { QuestDefinition } from "@/types/quests.types";

function formatDeletedAt(value?: string | Date | null) {
  if (!value) return "Date inconnue";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date inconnue";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function AdministrationQuetesPage() {
  const [quests, setQuests] = useState<QuestDefinition[]>([]);
  const [deletedQuests, setDeletedQuests] = useState<QuestDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDeleted, setLoadingDeleted] = useState(true);
  const [error, setError] = useState("");
  const [questToDelete, setQuestToDelete] = useState<QuestDefinition | null>(null);
  const [questToRestore, setQuestToRestore] = useState<QuestDefinition | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadQuests() {
    try {
      setLoading(true);
      setError("");
      setQuests(await getQuests());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les quêtes.");
    } finally {
      setLoading(false);
    }
  }

  async function loadDeletedQuests() {
    try {
      setLoadingDeleted(true);
      setDeletedQuests(await getDeletedQuests());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les quêtes supprimées.");
    } finally {
      setLoadingDeleted(false);
    }
  }

  useEffect(() => {
    void Promise.all([loadQuests(), loadDeletedQuests()]);
  }, []);

  async function confirmDelete() {
    if (!questToDelete) return;

    try {
      setActionLoading(true);
      setError("");
      await deleteQuest(questToDelete.questId);
      setQuestToDelete(null);
      await Promise.all([loadQuests(), loadDeletedQuests()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de supprimer la quête.");
    } finally {
      setActionLoading(false);
    }
  }

  async function confirmRestore() {
    if (!questToRestore) return;

    try {
      setActionLoading(true);
      setError("");
      await restoreQuest(questToRestore.questId);
      setQuestToRestore(null);
      await Promise.all([loadQuests(), loadDeletedQuests()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de restaurer la quête.");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#173d2b] text-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <header className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm uppercase tracking-[0.3em] text-amber-500">Administration</p>
            <h1 className="text-4xl font-bold">Gestion des quêtes</h1>
            <p className="mt-3 text-gray-300">Créez, modifiez et gérez les quêtes du Pacte du Chêne.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/administration/quetes/soumissions"
              className="rounded-lg bg-[#55734e] px-5 py-3 text-center font-semibold hover:bg-[#668c5e]"
            >
              Preuves en attente
            </Link>
            <Link
              href="/administration/quetes/nouvelle"
              className="rounded-lg bg-amber-600 px-5 py-3 text-center font-semibold hover:bg-amber-500"
            >
              + Nouvelle quête
            </Link>
          </div>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-900/20 p-4 text-red-300">
            {error}
          </div>
        )}

        {loading && (
          <div className="rounded-xl border border-white/10 bg-black/20 p-8 text-center text-gray-400">
            Chargement des quêtes...
          </div>
        )}

        {!loading && quests.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-black/20 p-10 text-center">
            <h2 className="text-xl font-semibold">Aucune quête active</h2>
            <p className="mt-2 text-gray-400">Créez une nouvelle quête ou restaurez une quête supprimée.</p>
          </div>
        )}

        {!loading && quests.length > 0 && (
          <div className="space-y-6">
            {quests.map((quest) => (
              <article
                key={quest.questId}
                className="overflow-hidden rounded-2xl border border-white/10 bg-black/20"
              >
                <div className="grid gap-0 lg:grid-cols-[320px_1fr]">
                  {quest.imageUrl ? (
                    <img src={quest.imageUrl} alt="" className="h-full min-h-64 w-full object-cover" />
                  ) : (
                    <div className="min-h-64 bg-gradient-to-br from-[#173d2b] to-[#081c13]" />
                  )}

                  <div className="p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-amber-500">{quest.questId}</p>
                        <h2 className="mt-1 text-2xl font-bold">{quest.name}</h2>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          quest.enabled
                            ? "bg-green-900/50 text-green-300"
                            : "bg-red-900/50 text-red-300"
                        }`}
                      >
                        {quest.enabled ? "Active" : "Désactivée"}
                      </span>
                    </div>

                    <div className="mt-3">
                      <QuestDifficulty value={quest.difficulty} />
                    </div>

                    <p className="mt-4 text-gray-400">{quest.description || "Aucune description."}</p>

                    <div className="mt-5 flex flex-wrap gap-2 text-sm text-gray-400">
                      <span className="rounded-lg bg-white/5 px-3 py-2">{quest.steps?.length ?? 0} étape(s)</span>
                      <span className="rounded-lg bg-white/5 px-3 py-2">{quest.objectives?.length ?? 0} objectif(s)</span>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3 border-t border-white/10 pt-5">
                      <Link
                        href={`/administration/quetes/${quest.questId}`}
                        className="rounded-lg bg-white/10 px-4 py-2 font-semibold hover:bg-white/20"
                      >
                        Modifier
                      </Link>
                      <button
                        type="button"
                        onClick={() => setQuestToDelete(quest)}
                        className="rounded-lg bg-red-900/60 px-4 py-2 font-semibold text-red-200 hover:bg-red-800"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <section className="mt-14 overflow-hidden rounded-2xl border border-amber-900/40 bg-[#102b1f]/80 shadow-[0_20px_60px_rgba(0,0,0,.18)]">
          <div className="border-b border-amber-900/30 bg-black/15 px-6 py-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-amber-500">Archives</p>
                <h2 className="mt-1 text-2xl font-bold">Quêtes supprimées</h2>
                <p className="mt-2 text-sm text-gray-400">
                  Les quêtes supprimées sont conservées avec leur historique et peuvent être restaurées à tout moment.
                </p>
              </div>
              <span className="rounded-full bg-amber-900/30 px-3 py-1 text-sm text-amber-300">
                {deletedQuests.length} quête{deletedQuests.length > 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {loadingDeleted ? (
            <div className="p-8 text-center text-gray-400">Chargement des archives...</div>
          ) : deletedQuests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Aucune quête supprimée.</div>
          ) : (
            <div className="divide-y divide-white/5">
              {deletedQuests.map((quest) => (
                <article
                  key={quest.questId}
                  className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.2em] text-amber-500">{quest.questId}</p>
                    <h3 className="mt-1 text-lg font-semibold text-white">{quest.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Supprimée le {formatDeletedAt(quest.deletedAt)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setQuestToRestore(quest)}
                    className="shrink-0 rounded-lg border border-amber-600/40 bg-amber-700/30 px-4 py-2 font-semibold text-amber-200 transition hover:bg-amber-600/40"
                  >
                    Restaurer
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {questToDelete && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-quest-title"
        >
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-amber-900/50 bg-[#10251a] shadow-[0_25px_80px_rgba(0,0,0,.65)]">
            <div className="border-b border-white/10 bg-[#0b1c14] px-6 py-5">
              <p className="text-xs uppercase tracking-[0.25em] text-red-400">Confirmation</p>
              <h2 id="delete-quest-title" className="mt-1 text-2xl font-bold text-white">
                Supprimer la quête ?
              </h2>
            </div>

            <div className="px-6 py-6">
              <p className="text-gray-300">
                Vous êtes sur le point de retirer la quête <strong className="text-white">« {questToDelete.name} »</strong>.
              </p>
              <p className="mt-4 text-sm leading-6 text-gray-400">
                La quête disparaîtra des quêtes disponibles pour les membres, mais son historique, sa progression et ses preuves seront conservés. Vous pourrez la restaurer depuis les archives.
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setQuestToDelete(null)}
                  className="rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 font-semibold text-gray-200 hover:bg-white/10 disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => void confirmDelete()}
                  className="rounded-lg bg-red-800 px-5 py-2.5 font-semibold text-red-100 hover:bg-red-700 disabled:cursor-wait disabled:opacity-50"
                >
                  {actionLoading ? "Suppression..." : "Supprimer la quête"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {questToRestore && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="restore-quest-title"
        >
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-amber-900/50 bg-[#10251a] shadow-[0_25px_80px_rgba(0,0,0,.65)]">
            <div className="border-b border-white/10 bg-[#0b1c14] px-6 py-5">
              <p className="text-xs uppercase tracking-[0.25em] text-amber-500">Archives</p>
              <h2 id="restore-quest-title" className="mt-1 text-2xl font-bold text-white">
                Restaurer la quête ?
              </h2>
            </div>

            <div className="px-6 py-6">
              <p className="text-gray-300">
                Restaurer <strong className="text-white">« {questToRestore.name} »</strong> et la rendre de nouveau disponible ?
              </p>
              <p className="mt-4 text-sm leading-6 text-gray-400">
                Son historique et les données conservées lors de sa suppression resteront inchangés.
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setQuestToRestore(null)}
                  className="rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 font-semibold text-gray-200 hover:bg-white/10 disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => void confirmRestore()}
                  className="rounded-lg bg-amber-700 px-5 py-2.5 font-semibold text-amber-50 hover:bg-amber-600 disabled:cursor-wait disabled:opacity-50"
                >
                  {actionLoading ? "Restauration..." : "Restaurer la quête"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
