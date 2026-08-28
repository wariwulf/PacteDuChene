"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import {
  completeQuest,
  getQuest,
  getUserQuests,
  startQuest,
} from "@/services/quests.service";

import QuestDifficulty from "@/components/member/quests/QuestDifficulty";
import ObjectiveSubmissionModal from "@/components/member/quests/ObjectiveSubmissionModal";

import type {
  QuestDefinition,
  UserQuest,
  QuestObjectiveValidationStatus,
} from "@/types/quests.types";

function validationLabel(
  status?: QuestObjectiveValidationStatus
) {
  switch (status) {
    case "not_required":
      return "Aucune preuve requise";
    case "not_submitted":
      return "Preuve à envoyer";
    case "pending":
      return "Preuve en attente";
    case "approved":
      return "Preuve validée";
    case "rejected":
      return "Preuve refusée";
    default:
      return "État non défini";
  }
}

function validationClass(
  status?: QuestObjectiveValidationStatus
) {
  switch (status) {
    case "approved":
      return "bg-green-900/40 text-green-300";
    case "pending":
      return "bg-amber-900/40 text-amber-300";
    case "rejected":
      return "bg-red-900/40 text-red-300";
    case "not_submitted":
      return "bg-blue-900/40 text-blue-300";
    default:
      return "bg-white/10 text-gray-400";
  }
}

export default function QueteDetailPage() {
  const params = useParams();
  const questId =
    String(params.questId ?? "");

  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
  } = useAuth();

  const [quest, setQuest] =
    useState<QuestDefinition | null>(null);

  const [userQuest, setUserQuest] =
    useState<UserQuest>();

  const [loading, setLoading] =
    useState(true);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [submissionObjective, setSubmissionObjective] =
    useState<{
      objectiveId: string;
      name: string;
    } | null>(null);

  async function load() {
    if (!questId || !user) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [
        questData,
        userQuests,
      ] = await Promise.all([
        getQuest(questId),
        getUserQuests(user.id),
      ]);

      setQuest(questData);

      setUserQuest(
        userQuests.find(
          (item) =>
            item.questId === questId
        )
      );
    } catch (err) {
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
    if (
      !authLoading &&
      isAuthenticated &&
      user
    ) {
      void load();
    }
  }, [
    authLoading,
    isAuthenticated,
    user,
    questId,
  ]);

  const progress =
    useMemo(
      () =>
        new Map(
          (
            userQuest?.objectives ??
            []
          ).map(
            (item) => [
              item.objectiveId,
              item,
            ]
          )
        ),
      [userQuest]
    );

  async function start() {
    if (!user) return;

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      await startQuest(
        user.id,
        questId
      );

      setSuccess(
        "La quête a été commencée."
      );

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

  async function complete() {
    if (!user) return;

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      await completeQuest(
        user.id,
        questId
      );

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

  function handleSubmitted() {
    setSuccess(
      "Votre preuve a été envoyée à l'administration."
    );

    void load();
  }

  if (
    authLoading ||
    loading
  ) {
    return (
      <main className="min-h-screen bg-[#173d2b] text-white">
        <div className="mx-auto max-w-5xl px-6 py-12 text-gray-400">
          Chargement de la quête...
        </div>
      </main>
    );
  }

  if (
    !isAuthenticated ||
    !user ||
    !quest
  ) {
    return null;
  }

  const objectivesComplete = quest.objectives.every(
    (objective) => {
      const objectiveProgress = progress.get(
        objective.objectiveId
      );

      if (objectiveProgress?.current === undefined) {
        return false;
      }

      if (objectiveProgress.current < objective.target) {
        return false;
      }

      return (
        objective.requiresProof !== true ||
        objectiveProgress.validationStatus === "approved"
      );
    }
  );

  const steps =
    quest.steps?.length
      ? quest.steps
      : [
          {
            stepId: "legacy",
            name: "Étape principale",
            description:
              quest.description,
            imageUrl: undefined,
            difficulty:
              quest.difficulty,
            objectives:
              quest.objectives,
          },
        ];

  return (
    <main className="min-h-screen bg-[#173d2b] text-white">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <Link
          href="/quetes"
          className="text-sm text-gray-400 hover:text-white"
        >
          ← Retour aux quêtes
        </Link>

        <header className="mt-6">
          <p className="text-sm uppercase tracking-[0.3em] text-amber-500">
            Le Pacte du Chêne
          </p>

          <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <h1 className="text-4xl font-bold">
              {quest.name}
            </h1>

            <QuestDifficulty
              value={quest.difficulty}
            />
          </div>
        </header>

        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
          {quest.imageUrl ? (
            <img
              src={quest.imageUrl}
              alt=""
              className="mx-auto block h-auto max-h-[420px] w-full object-contain bg-black/20"
            />
          ) : (
            <div className="flex h-72 items-center justify-center bg-black/20 text-white/30">
              Aucune illustration
            </div>
          )}
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-900/30 p-4 text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-6 rounded-xl border border-green-500/20 bg-green-900/30 p-4 text-green-300">
            {success}
          </div>
        )}

        <section className="mt-8 rounded-xl border border-white/10 bg-black/20 p-6">
          <h2 className="text-xl font-bold">
            Description
          </h2>

          <p className="mt-3 text-gray-300">
            {quest.description ||
              "Aucune description."}
          </p>
        </section>

        <section className="mt-8 space-y-8">
          {steps.map(
            (step, index) => (
              <article
                key={step.stepId}
                className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d3022]"
              >
                <div className="p-6">
                  <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-amber-500">
                        Étape {index + 1}
                      </p>

                      <h2 className="mt-1 text-2xl font-bold">
                        {step.name}
                      </h2>
                    </div>

                    <QuestDifficulty
                      value={
                        step.difficulty
                      }
                    />
                  </div>
                </div>

                {step.imageUrl && (
                  <img
                    src={step.imageUrl}
                    alt=""
                    className="mx-auto block h-auto max-h-[280px] w-full object-contain bg-black/20"
                  />
                )}

                <div className="p-6">
                  {step.description && (
                    <p className="mb-5 text-gray-300">
                      {
                        step.description
                      }
                    </p>
                  )}

                  <div className="space-y-3">
                    {step.objectives.map(
                      (objective) => {
                        const userObjective =
                          progress.get(
                            objective.objectiveId
                          );

                        const current =
                          userObjective?.current ??
                          0;

                        const percent =
                          Math.min(
                            100,
                            (current /
                              objective.target) *
                              100
                          );

                        // Toute quête active permet de demander une validation
                        // manuelle, même lorsque l'objectif n'est pas marqué
                        // requiresProof. La validation administrative est ce
                        // qui transforme alors la progression en objectif terminé.
                        const status =
                          userObjective?.validationStatus ??
                          (objective.requiresProof
                            ? "not_submitted"
                            : "not_required");

                        const canSubmit =
                          Boolean(
                            userQuest?.status ===
                              "active" &&
                              status !== "approved" &&
                              status !== "pending"
                          );

                        return (
                          <div
                            key={
                              objective.objectiveId
                            }
                            className="rounded-xl border border-white/10 bg-black/20 p-4"
                          >
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                              <div>
                                <h3 className="font-semibold">
                                  {
                                    objective.name
                                  }
                                </h3>

                                {objective.description && (
                                  <p className="mt-1 text-sm text-gray-500">
                                    {
                                      objective.description
                                    }
                                  </p>
                                )}

                                {objective.requiresProof || status !== "not_required" ? (
                                  <span
                                    className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${validationClass(
                                      status
                                    )}`}
                                  >
                                    {validationLabel(
                                      status
                                    )}
                                  </span>
                                ) : null}
                              </div>

                              <span
                                className={
                                  current >=
                                  objective.target
                                    ? "text-green-400"
                                    : "text-gray-300"
                                }
                              >
                                {current}/
                                {
                                  objective.target
                                }
                              </span>
                            </div>

                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                              <div
                                className="h-full rounded-full bg-amber-500"
                                style={{
                                  width: `${percent}%`,
                                }}
                              />
                            </div>

                            {userObjective?.validationMessage && (
                                <div
                                  className={`mt-3 rounded-lg border p-3 text-sm ${
                                    status ===
                                    "rejected"
                                      ? "border-red-500/20 bg-red-950/20 text-red-200"
                                      : "border-white/10 bg-white/[.03] text-gray-300"
                                  }`}
                                >
                                  {
                                    userObjective.validationMessage
                                  }
                                </div>
                              )}

                            {canSubmit && (
                              <button
                                type="button"
                                onClick={() =>
                                  setSubmissionObjective(
                                    {
                                      objectiveId:
                                        objective.objectiveId,
                                      name:
                                        objective.name,
                                    }
                                  )
                                }
                                className="mt-4 rounded-lg bg-[#a77c36] px-4 py-2.5 text-sm font-semibold text-[#17130c] hover:bg-[#bd9147]"
                              >
                                Demander la validation de l'objectif
                              </button>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              </article>
            )
          )}
        </section>

        <section className="mt-8 rounded-xl border border-white/10 bg-black/20 p-6">
          <h2 className="text-xl font-bold">
            Récompenses
          </h2>

          <div className="mt-4 flex flex-wrap gap-2">
            {quest.rewardXp > 0 && (
              <span className="rounded-lg bg-amber-900/30 px-3 py-2 text-amber-300">
                ✦ {quest.rewardXp} XP
              </span>
            )}

            {quest.rewardAmount > 0 && (
              <span className="rounded-lg bg-blue-900/30 px-3 py-2 text-blue-300">
                ◈ {quest.rewardAmount}{" "}
                {quest.rewardCurrencyId ??
                  ""}
              </span>
            )}

            {quest.rewardAchievementId && (
              <span className="rounded-lg bg-purple-900/30 px-3 py-2 text-purple-300">
                🏆 Succès
              </span>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {!userQuest && (
              <button
                type="button"
                onClick={start}
                disabled={
                  actionLoading ||
                  !objectivesComplete
                }
                className="rounded-lg bg-amber-600 px-5 py-3 font-semibold hover:bg-amber-500 disabled:opacity-50"
              >
                Commencer la quête
              </button>
            )}

            {userQuest?.status ===
              "active" && (
              <button
                type="button"
                onClick={complete}
                disabled={
                  actionLoading ||
                  !objectivesComplete
                }
                className="rounded-lg bg-amber-600 px-5 py-3 font-semibold hover:bg-amber-500 disabled:opacity-50"
              >
                {actionLoading
                  ? "Validation..."
                  : objectivesComplete
                    ? "Terminer la quête"
                    : "Objectifs à valider"}
              </button>
            )}
          </div>
        </section>
      </div>

      <ObjectiveSubmissionModal
        open={
          submissionObjective !==
          null
        }
        userId={user.id}
        questId={questId}
        objectiveId={
          submissionObjective?.objectiveId ??
          ""
        }
        objectiveName={
          submissionObjective?.name ??
          ""
        }
        onClose={() =>
          setSubmissionObjective(
            null
          )
        }
        onSubmitted={
          handleSubmitted
        }
      />
    </main>
  );
}
