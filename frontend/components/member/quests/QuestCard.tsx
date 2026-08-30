"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import QuestDifficulty from "./QuestDifficulty";
import ObjectiveSubmissionModal from "./ObjectiveSubmissionModal";

import type {
  QuestDefinition,
  QuestObjectiveValidationStatus,
  UserQuest,
} from "@/types/quests.types";

type Props = {
  quest: QuestDefinition;
  userQuest?: UserQuest;
  userId: string;
  onStart: (questId: string) => void;
  onComplete: (questId: string) => void;
  onRefresh?: () => void;
  loading: boolean;
};

function validationLabel(status?: QuestObjectiveValidationStatus) {
  switch (status) {
    case "not_required":
      return "Aucune preuve requise";
    case "not_submitted":
      return "Preuve à envoyer";
    case "pending":
      return "Validation en attente";
    case "approved":
      return "Objectif validé";
    case "rejected":
      return "Preuve refusée";
    default:
      return "État non défini";
  }
}

function validationClass(status?: QuestObjectiveValidationStatus) {
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

export default function QuestCard({
  quest,
  userQuest,
  userId,
  onStart,
  onComplete,
  onRefresh,
  loading,
}: Props) {
  const [submissionObjective, setSubmissionObjective] = useState<{
    objectiveId: string;
    name: string;
  } | null>(null);

  const isCompleted = userQuest?.status === "completed";
  const isActive = userQuest?.status === "active";

  const statusLabel = !userQuest
    ? "Disponible"
    : isCompleted
      ? "Terminée"
      : "En cours";

  const progress = useMemo(
    () =>
      new Map(
        (userQuest?.objectives ?? []).map((item) => [
          item.objectiveId,
          item,
        ])
      ),
    [userQuest]
  );

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

  const objectivesComplete = quest.objectives.every((objective) => {
    const current = progress.get(objective.objectiveId)?.current ?? 0;

    if (current < objective.target) {
      return false;
    }

    return (
      objective.requiresProof !== true ||
      progress.get(objective.objectiveId)?.validationStatus === "approved"
    );
  });

  function openSubmission(objectiveId: string, name: string) {
    setSubmissionObjective({ objectiveId, name });
  }

  function handleSubmitted() {
    onRefresh?.();
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d3022] shadow-xl">
      <header className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-amber-500">
              Quête
            </p>
            <h2 className="mt-1 text-3xl font-bold">{quest.name}</h2>
          </div>

          <div className="flex flex-col items-start gap-2 md:items-end">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                isCompleted
                  ? "bg-green-900/50 text-green-300"
                  : isActive
                    ? "bg-amber-900/50 text-amber-300"
                    : "bg-white/10 text-gray-300"
              }`}
            >
              {statusLabel}
            </span>
            <QuestDifficulty value={quest.difficulty} />
          </div>
        </div>
      </header>

      <div className="mx-6 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
        {quest.imageUrl ? (
          <img
            src={quest.imageUrl}
            alt={quest.name}
            className="block h-auto max-h-[420px] w-full object-contain"
          />
        ) : (
          <div className="flex h-64 items-center justify-center bg-gradient-to-br from-[#173d2b] via-[#214d36] to-[#0b2419]">
            <span className="text-sm uppercase tracking-[0.3em] text-white/30">
              Le Pacte du Chêne
            </span>
          </div>
        )}
      </div>

      <div className="p-6">
        <section className="rounded-xl border border-white/10 bg-black/20 p-6">
          <h3 className="text-xl font-bold">Description</h3>
          <p className="mt-3 text-gray-300">
            {quest.description || "Aucune description disponible."}
          </p>
        </section>

        <section className="mt-8 space-y-6">
          {steps.map((step, index) => (
            <article
              key={step.stepId}
              className="overflow-hidden rounded-2xl border border-white/10 bg-black/20"
            >
              <div className="p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-amber-500">
                      Étape {index + 1}
                    </p>
                    <h3 className="mt-1 text-2xl font-bold">{step.name}</h3>
                  </div>
                  <QuestDifficulty value={step.difficulty} />
                </div>
              </div>

              {step.imageUrl && (
                <div className="border-y border-white/10 bg-black/20">
                  <img
                    src={step.imageUrl}
                    alt={step.name}
                    className="mx-auto block h-auto max-h-[280px] w-full object-contain"
                  />
                </div>
              )}

              <div className="p-6">
                {step.description && (
                  <p className="mb-5 text-gray-300">{step.description}</p>
                )}

                <div className="space-y-3">
                  {step.objectives.map((objective) => {
                    const userObjective = progress.get(objective.objectiveId);
                    const current = userObjective?.current ?? 0;
                    const percent =
                      objective.target > 0
                        ? Math.min(100, (current / objective.target) * 100)
                        : 100;

                    // Toute quête active peut faire l'objet d'une demande de
                    // validation manuelle. La preuve ne dépend donc plus de
                    // requiresProof ni de la progression courante.
                    const validationStatus =
                      userObjective?.validationStatus ??
                      (objective.requiresProof
                        ? "not_submitted"
                        : "not_required");

                    const canSubmit = Boolean(
                      isActive &&
                        validationStatus !== "approved" &&
                        validationStatus !== "pending"
                    );

                    return (
                      <div
                        key={objective.objectiveId}
                        className="rounded-xl border border-white/10 bg-[#173d2b]/70 p-4"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <h4 className="font-semibold">{objective.name}</h4>
                            {objective.description && (
                              <p className="mt-1 text-sm text-gray-400">
                                {objective.description}
                              </p>
                            )}

                            {objective.requiresProof || validationStatus !== "not_required" ? (
                              <span
                                className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${validationClass(
                                  validationStatus
                                )}`}
                              >
                                {validationLabel(validationStatus)}
                              </span>
                            ) : null}
                          </div>

                          <span
                            className={`font-semibold ${
                              current >= objective.target
                                ? "text-green-400"
                                : "text-gray-300"
                            }`}
                          >
                            {current}/{objective.target}
                          </span>
                        </div>

                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-amber-500 transition-all"
                            style={{ width: `${percent}%` }}
                          />
                        </div>

                        {userObjective?.validationMessage && (
                          <div
                            className={`mt-3 rounded-lg border p-3 text-sm ${
                              validationStatus === "rejected"
                                ? "border-red-500/20 bg-red-950/20 text-red-200"
                                : "border-white/10 bg-white/[.03] text-gray-300"
                            }`}
                          >
                            {userObjective.validationMessage}
                          </div>
                        )}

                        {canSubmit && (
                          <button
                            type="button"
                            onClick={() =>
                              openSubmission(
                                objective.objectiveId,
                                objective.name
                              )
                            }
                            className="mt-4 rounded-lg bg-[#a77c36] px-4 py-2.5 text-sm font-bold text-[#17130c] transition hover:bg-[#bd9147]"
                          >
                            Demander la validation de l'objectif
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-xl border border-white/10 bg-black/20 p-6">
          <h3 className="text-xl font-bold">Récompenses</h3>

          <div className="mt-4 flex flex-wrap gap-2">
            {quest.rewardXp > 0 && (
              <span className="rounded-lg bg-amber-900/30 px-3 py-2 text-sm text-amber-300">
                ✦ {quest.rewardXp} XP
              </span>
            )}

            {quest.rewardAmount > 0 && (
              <span className="rounded-lg bg-blue-900/30 px-3 py-2 text-sm text-blue-300">
                ◈ {quest.rewardAmount} {quest.rewardCurrencyId ?? ""}
              </span>
            )}

            {quest.rewardAchievementId && (
              <span className="rounded-lg bg-purple-900/30 px-3 py-2 text-sm text-purple-300">
                🏆 Succès
              </span>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/quetes/${quest.questId}`}
              className="rounded-lg bg-white/10 px-5 py-3 font-semibold transition hover:bg-white/20"
            >
              Voir la quête complète
            </Link>

            {!userQuest && (
              <button
                type="button"
                disabled={loading}
                onClick={() => onStart(quest.questId)}
                className="rounded-lg bg-amber-600 px-5 py-3 font-semibold transition hover:bg-amber-500 disabled:opacity-50"
              >
                {loading ? "Chargement..." : "Commencer la quête"}
              </button>
            )}

            {isActive && (
              <button
                type="button"
                disabled={loading || !objectivesComplete}
                onClick={() => onComplete(quest.questId)}
                className="rounded-lg bg-amber-600 px-5 py-3 font-semibold transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
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
        open={submissionObjective !== null}
        userId={userId}
        questId={quest.questId}
        objectiveId={submissionObjective?.objectiveId ?? ""}
        objectiveName={submissionObjective?.name ?? ""}
        onClose={() => setSubmissionObjective(null)}
        onSubmitted={handleSubmitted}
      />
    </article>
  );
}