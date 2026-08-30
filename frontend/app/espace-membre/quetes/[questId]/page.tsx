"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import {
  completeQuest,
  getQuest,
  getUserQuests,
  startQuest,
} from "@/services/quests.service";

import QuestDifficulty from "@/components/member/quests/QuestDifficulty";
import type { QuestDefinition, UserQuest } from "@/types/quests.types";

export default function QueteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const questId = String(params.questId ?? "");

  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [quest, setQuest] = useState<QuestDefinition | null>(null);
  const [userQuest, setUserQuest] = useState<UserQuest>();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/connexion");
    }
  }, [authLoading, isAuthenticated, router]);

  async function load() {
    if (!questId || !user) return;

    try {
      setLoading(true);
      setError("");

      const [questData, userQuests] = await Promise.all([
        getQuest(questId),
        getUserQuests(user.id),
      ]);

      setQuest(questData);
      setUserQuest(
        userQuests.find((item) => item.questId === questId)
      );
    } catch (err) {
      console.error("Erreur chargement quête :", err);
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger la quête."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      void load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, user, questId]);

  const progress = useMemo(
    () =>
      new Map(
        (userQuest?.objectives ?? []).map((item) => [
          item.objectiveId,
          item.current,
        ])
      ),
    [userQuest]
  );

  async function handleStart() {
    if (!user) return;

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      await startQuest(user.id, questId);
      setSuccess("La quête a été commencée.");
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de démarrer la quête."
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleComplete() {
    if (!user) return;

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      await completeQuest(user.id, questId);
      setSuccess(
        "Quête terminée. Les récompenses ont été attribuées."
      );
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de terminer la quête."
      );
    } finally {
      setActionLoading(false);
    }
  }

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-[#07150f] text-white">
        <div className="mx-auto max-w-5xl px-6 py-12 text-gray-300">
          Chargement de la quête...
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (!quest) {
    return (
      <main className="min-h-screen bg-[#07150f] text-white">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <Link
            href="/espace-membre/quetes"
            className="text-sm text-gray-300 hover:text-amber-300"
          >
            ← Retour aux quêtes
          </Link>

          <div className="mt-8 rounded-2xl border border-red-400/20 bg-[#240f0b]/90 p-8">
            <h1 className="text-2xl font-bold">Quête introuvable</h1>
            <p className="mt-2 text-red-200">
              {error || "Cette quête n'existe plus ou n'est pas disponible."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const steps = quest.steps?.length
    ? quest.steps
    : [
        {
          stepId: "legacy",
          name: "Étape principale",
          description: quest.description,
          imageUrl: undefined,
          difficulty: quest.difficulty,
          objectives: quest.objectives,
        },
      ];

  const status = !userQuest
    ? "Disponible"
    : userQuest.status === "completed"
      ? "Terminée"
      : "En cours";

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#07150f] text-white"
      style={{
        backgroundImage: "url('/images/backgrounds/quetes-background.png')",
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(3,14,9,0.55),rgba(3,14,9,0.72)_50%,rgba(3,14,9,0.88)_100%)]" />

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-12">
        <Link
          href="/espace-membre/quetes"
          className="text-sm font-semibold text-gray-300 transition hover:text-amber-300"
        >
          ← Retour aux quêtes
        </Link>

        <header className="mt-7">
          <p className="text-sm uppercase tracking-[0.3em] text-amber-500">
            Le Pacte du Chêne
          </p>

          <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-amber-500/30 bg-[#062015]/90 px-3 py-1 text-xs font-semibold text-amber-300">
                  {status}
                </span>
                <QuestDifficulty value={quest.difficulty} />
              </div>

              <h1 className="mt-4 text-4xl font-bold md:text-5xl">
                {quest.name}
              </h1>
            </div>
          </div>
        </header>

        {error && (
          <div className="mt-6 rounded-xl border border-red-400/30 bg-[#240f0b]/90 p-4 text-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-6 rounded-xl border border-green-400/30 bg-[#062015]/95 p-4 text-green-200">
            {success}
          </div>
        )}

        <section className="mt-8 overflow-hidden rounded-2xl border border-amber-500/20 bg-[#062015]/95 shadow-2xl">
          {quest.imageUrl ? (
            <img
              src={quest.imageUrl}
              alt=""
              className="max-h-[520px] w-full object-cover"
            />
          ) : (
            <div className="flex h-72 items-center justify-center bg-gradient-to-br from-[#173d2b] via-[#0d3022] to-[#03170e]">
              <span className="text-sm uppercase tracking-[0.3em] text-white/30">
                Le Pacte du Chêne
              </span>
            </div>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-[#062015]/95 p-7 shadow-2xl">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-500">
            Description
          </p>
          <h2 className="mt-2 text-2xl font-bold">La mission</h2>
          <p className="mt-4 max-w-4xl leading-7 text-gray-300">
            {quest.description || "Aucune description disponible."}
          </p>
        </section>

        <section className="mt-8">
          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.25em] text-amber-500">
              Déroulement
            </p>
            <h2 className="mt-1 text-3xl font-bold">Objectifs de la quête</h2>
          </div>

          <div className="space-y-6">
            {steps.map((step, index) => (
              <article
                key={step.stepId}
                className="overflow-hidden rounded-2xl border border-white/10 bg-[#062015]/95 shadow-2xl"
              >
                <div className="p-7">
                  <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-amber-500">
                        Étape {index + 1}
                      </p>
                      <h3 className="mt-1 text-2xl font-bold">{step.name}</h3>
                    </div>

                    <QuestDifficulty value={step.difficulty} />
                  </div>

                  {step.description && (
                    <p className="mt-4 leading-7 text-gray-300">
                      {step.description}
                    </p>
                  )}
                </div>

                {step.imageUrl && (
                  <img
                    src={step.imageUrl}
                    alt=""
                    className="max-h-80 w-full object-cover"
                  />
                )}

                <div className="space-y-3 p-7 pt-0">
                  {step.objectives.map((objective) => {
                    const current = progress.get(objective.objectiveId) ?? 0;
                    const target = Math.max(1, objective.target);
                    const percent = Math.min(
                      100,
                      Math.round((current / target) * 100)
                    );
                    const completed = current >= target;

                    return (
                      <div
                        key={objective.objectiveId}
                        className="rounded-xl border border-white/10 bg-black/20 p-5"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h4 className="font-semibold text-white">
                              {objective.name}
                            </h4>

                            {objective.description && (
                              <p className="mt-1 text-sm text-gray-400">
                                {objective.description}
                              </p>
                            )}
                          </div>

                          <span
                            className={`shrink-0 font-semibold ${
                              completed
                                ? "text-green-400"
                                : "text-gray-200"
                            }`}
                          >
                            {current}/{objective.target}
                          </span>
                        </div>

                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                          <div
                            className={`h-full rounded-full transition-all ${
                              completed
                                ? "bg-green-500"
                                : "bg-amber-500"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>

                        <p className="mt-2 text-xs text-gray-500">
                          {percent}% accompli
                        </p>
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-amber-500/20 bg-[#062015]/95 p-7 shadow-2xl">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-500">
            Récompenses
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            {quest.rewardXp > 0 && (
              <span className="rounded-lg border border-amber-500/20 bg-amber-900/20 px-4 py-3 font-semibold text-amber-300">
                ✦ {quest.rewardXp} XP
              </span>
            )}

            {quest.rewardAmount > 0 && (
              <span className="rounded-lg border border-amber-500/20 bg-amber-900/20 px-4 py-3 font-semibold text-amber-300">
                ◈ {quest.rewardAmount} {quest.rewardCurrencyId ?? ""}
              </span>
            )}

            {quest.rewardAchievementId && (
              <span className="rounded-lg border border-purple-400/20 bg-purple-900/20 px-4 py-3 font-semibold text-purple-300">
                🏆 Succès
              </span>
            )}

            {quest.rewardXp <= 0 &&
              quest.rewardAmount <= 0 &&
              !quest.rewardAchievementId && (
                <p className="text-gray-400">
                  Aucune récompense renseignée pour cette quête.
                </p>
              )}
          </div>

          <div className="mt-7 flex flex-wrap gap-3 border-t border-white/10 pt-6">
            {!userQuest && (
              <button
                type="button"
                onClick={handleStart}
                disabled={actionLoading}
                className="rounded-lg bg-amber-600 px-5 py-3 font-semibold text-black transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading ? "Chargement..." : "Commencer la quête"}
              </button>
            )}

            {userQuest?.status === "active" && (
              <button
                type="button"
                onClick={handleComplete}
                disabled={actionLoading}
                className="rounded-lg bg-amber-600 px-5 py-3 font-semibold text-black transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading ? "Validation..." : "Terminer la quête"}
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
