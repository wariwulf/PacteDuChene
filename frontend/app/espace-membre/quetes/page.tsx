"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/api/auth";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

/* ============================================================
   TYPES
   ============================================================ */

interface QuestObjective {
  objectiveId: string;
  name: string;
  description?: string;
  target: number;
}

interface Quest {
  questId: string;
  name: string;
  description?: string;
  prerequisites?: string[];
  objectives: QuestObjective[];
  rewardXp?: number;
  rewardCurrencyId?: string;
  rewardAmount?: number;
  rewardAchievementId?: string;
  imageUrl?: string;
  enabled?: boolean;
}

interface UserQuestObjective {
  objectiveId: string;
  current?: number;
  completed?: boolean;
}

interface UserQuest {
  questId: string;
  userId?: string;
  status?: string;
  objectives?: UserQuestObjective[];
}

type QuestStatus = "available" | "active" | "completed";
type FilterStatus = "all" | QuestStatus;

/* ============================================================
   ASSETS
   ============================================================ */

const QUEST_STATUS_ASSETS = {
  available: "/images/quetes/Quetedispo.png",
  active: "/images/quetes/Quetecours.png",
  completed: "/images/quetes/Quetefinis.png",
} as const;

/* ============================================================
   HELPERS API
   ============================================================ */

function extractArray<T>(payload: any): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.quests)) return payload.data.quests;
  if (Array.isArray(payload?.quests)) return payload.quests;
  if (Array.isArray(payload?.data?.userQuests)) return payload.data.userQuests;
  if (Array.isArray(payload?.userQuests)) return payload.userQuests;

  return [];
}

/* ============================================================
   PAGE
   ============================================================ */

export default function QuetesPage() {
  const [userId, setUserId] = useState("");
  const [quests, setQuests] = useState<Quest[]>([]);
  const [userQuests, setUserQuests] = useState<UserQuest[]>([]);

  const [filter, setFilter] = useState<FilterStatus>("all");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  /* ==========================================================
     RÉCUPÉRATION DE L'UTILISATEUR CONNECTÉ
     ========================================================== */

  useEffect(() => {
    let cancelled = false;

    async function loadCurrentUser() {
      try {
        setLoading(true);
        setError("");

        const currentUser = await getCurrentUser();

        console.log(
          "🌳 Pacte du Chêne - Utilisateur connecté :",
          currentUser
        );

        const id =
          currentUser?.id ??
          (currentUser as any)?.userId ??
          (currentUser as any)?.user_id ??
          (currentUser as any)?.memberId ??
          (currentUser as any)?.member_id ??
          (currentUser as any)?._id;

        if (!id) {
          console.error(
            "🌳 Pacte du Chêne - Aucun ID trouvé dans l'utilisateur :",
            currentUser
          );

          if (!cancelled) {
            setUserId("");
            setError(
              "Impossible d'identifier le membre connecté."
            );
          }

          return;
        }

        if (!cancelled) {
          console.log(
            "🌳 Pacte du Chêne - User ID détecté :",
            id
          );

          setUserId(String(id));
        }
      } catch (err) {
        console.error(
          "🌳 Pacte du Chêne - Erreur récupération utilisateur :",
          err
        );

        if (!cancelled) {
          setUserId("");
          setError(
            err instanceof Error
              ? err.message
              : "Impossible de récupérer l'utilisateur connecté."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ==========================================================
     CHARGEMENT DES QUÊTES
     ========================================================== */

  useEffect(() => {
    if (!userId) return;

    void loadQuests();
  }, [userId]);

  async function loadQuests() {
    try {
      setError("");

      const questsResponse = await fetch(`${API_URL}/quests`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      if (!questsResponse.ok) {
        throw new Error(
          `Impossible de récupérer les quêtes (${questsResponse.status}).`
        );
      }

      const questsJson = await questsResponse.json();
      const normalizedQuests = extractArray<Quest>(questsJson);

      setQuests(normalizedQuests);

      const userQuestsResponse = await fetch(
        `${API_URL}/quests/user/${encodeURIComponent(userId)}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!userQuestsResponse.ok) {
        throw new Error(
          `Impossible de récupérer les quêtes du membre (${userQuestsResponse.status}).`
        );
      }

      const userQuestsJson = await userQuestsResponse.json();
      const normalizedUserQuests =
        extractArray<UserQuest>(userQuestsJson);

      setUserQuests(normalizedUserQuests);
    } catch (err) {
      console.error("Erreur chargement quêtes :", err);

      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger les quêtes."
      );
    }
  }

  /* ==========================================================
     HELPERS MÉTIER
     ========================================================== */

  function getUserQuest(questId: string): UserQuest | undefined {
    return userQuests.find(
      (userQuest) =>
        String(userQuest.questId) === String(questId)
    );
  }

  function getQuestStatus(quest: Quest): QuestStatus {
    const userQuest = getUserQuest(quest.questId);

    if (!userQuest) return "available";
    if (userQuest.status === "completed") return "completed";

    return "active";
  }

  function prerequisitesCompleted(quest: Quest): boolean {
    if (!quest.prerequisites?.length) return true;

    return quest.prerequisites.every((prerequisiteId) => {
      const prerequisite = getUserQuest(prerequisiteId);
      return prerequisite?.status === "completed";
    });
  }

  function getObjectiveProgress(
    quest: Quest,
    objective: QuestObjective
  ) {
    const userQuest = getUserQuest(quest.questId);

    if (!userQuest) {
      return {
        current: 0,
        completed: false,
      };
    }

    const userObjective = (userQuest.objectives ?? []).find(
      (item) => item.objectiveId === objective.objectiveId
    );

    const current = userObjective?.current ?? 0;

    return {
      current,
      completed:
        userObjective?.completed === true ||
        current >= objective.target,
    };
  }

  /* ==========================================================
     ACTIONS
     ========================================================== */

  async function startQuest(questId: string) {
    if (!userId) {
      setError("Impossible d'identifier le membre connecté.");
      return;
    }

    try {
      setActionLoading(questId);
      setError("");

      const response = await fetch(
        `${API_URL}/quests/user/${userId}/${questId}/start`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const json = await response.json();

      if (!response.ok) {
        throw new Error(
          json?.message || "Impossible de démarrer la quête."
        );
      }

      await loadQuests();
    } catch (err) {
      console.error("Erreur démarrage quête :", err);

      setError(
        err instanceof Error
          ? err.message
          : "Impossible de démarrer la quête."
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function completeQuest(questId: string) {
    if (!userId) {
      setError("Impossible d'identifier le membre connecté.");
      return;
    }

    try {
      setActionLoading(questId);
      setError("");

      const response = await fetch(
        `${API_URL}/quests/user/${userId}/${questId}/complete`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const json = await response.json();

      if (!response.ok) {
        throw new Error(
          json?.message || "Impossible de terminer la quête."
        );
      }

      await loadQuests();
    } catch (err) {
      console.error("Erreur validation quête :", err);

      setError(
        err instanceof Error
          ? err.message
          : "Impossible de terminer la quête."
      );
    } finally {
      setActionLoading(null);
    }
  }

  /* ==========================================================
     QUÊTES + COMPTEURS
     ========================================================== */

  const enabledQuests = useMemo(
    () => quests.filter((quest) => quest.enabled !== false),
    [quests]
  );

  const questCounts = useMemo(() => {
    return enabledQuests.reduce(
      (counts, quest) => {
        const status = getQuestStatus(quest);

        counts[status] += 1;
        counts.all += 1;

        return counts;
      },
      {
        all: 0,
        available: 0,
        active: 0,
        completed: 0,
      }
    );
  }, [enabledQuests, userQuests]);

  const filteredQuests = useMemo(() => {
    if (filter === "all") return enabledQuests;

    return enabledQuests.filter(
      (quest) => getQuestStatus(quest) === filter
    );
  }, [enabledQuests, filter, userQuests]);

  /* ==========================================================
     RENDU
     ========================================================== */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0f3d2e] px-6 py-12 text-white">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-4 text-4xl font-bold">Quêtes</h1>
          <p className="text-gray-300">Chargement des quêtes...</p>
        </div>
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="min-h-screen bg-[#0f3d2e] px-6 py-12 text-white">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-4 text-4xl font-bold">Quêtes</h1>
          <p className="text-red-400">
            Impossible d'identifier le membre connecté.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen bg-[#0f3d2e] bg-cover bg-center bg-fixed bg-no-repeat px-4 py-8 text-white sm:px-6 sm:py-12"
      style={{
        backgroundImage:
          "linear-gradient(rgba(3, 18, 12, 0.24), rgba(3, 18, 12, 0.40)), url('/images/quetes/fond-quetes.png')",
      }}
    >
      <div className="mx-auto max-w-6xl">

        {/* ==================================================
            EN-TÊTE
            ================================================== */}

        <header className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-amber-500">
            Le Pacte du Chêne
          </p>

          <h1 className="text-4xl font-bold sm:text-5xl">
            Quêtes
          </h1>

          <p className="mt-3 max-w-2xl text-gray-300">
            Accomplissez les missions confiées aux membres du Pacte
            et faites progresser votre réputation.
          </p>
        </header>

        {/* ==================================================
            COMPTEURS
            ================================================== */}

        <section className="mb-8 grid gap-4 md:grid-cols-3">
          <StatCard
            icon={QUEST_STATUS_ASSETS.available}
            label="Quêtes disponibles"
            value={questCounts.available}
          />

          <StatCard
            icon={QUEST_STATUS_ASSETS.active}
            label="Quêtes en cours"
            value={questCounts.active}
          />

          <StatCard
            icon={QUEST_STATUS_ASSETS.completed}
            label="Quêtes terminées"
            value={questCounts.completed}
          />
        </section>

        {/* ==================================================
            BARRE DE FILTRES
            ================================================== */}

        <section className="mb-8 rounded-xl border border-amber-500/20 bg-[#08291c]/95 p-2 shadow-lg">
          <div className="flex flex-wrap gap-2">
            <FilterButton
              active={filter === "all"}
              label="Toutes les quêtes"
              count={questCounts.all}
              onClick={() => setFilter("all")}
            />

            <FilterButton
              active={filter === "available"}
              label="Disponibles"
              count={questCounts.available}
              onClick={() => setFilter("available")}
            />

            <FilterButton
              active={filter === "active"}
              label="En cours"
              count={questCounts.active}
              onClick={() => setFilter("active")}
            />

            <FilterButton
              active={filter === "completed"}
              label="Terminées"
              count={questCounts.completed}
              onClick={() => setFilter("completed")}
            />
          </div>
        </section>

        {/* ==================================================
            ERREUR
            ================================================== */}

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-950/30 p-4 text-red-300">
            {error}
          </div>
        )}

        {/* ==================================================
            TITRE LISTE
            ================================================== */}

        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.3em] text-amber-500">
                Le registre
              </p>

              <h2 className="text-2xl font-bold sm:text-3xl">
                Missions du Pacte
              </h2>

              <p className="mt-2 text-sm text-gray-400">
                Chaque fiche présente uniquement l'essentiel.
                Ouvrez le détail pour consulter le déroulement complet.
              </p>
            </div>

            <span className="hidden shrink-0 text-sm text-gray-400 sm:block">
              {filteredQuests.length}{" "}
              {filteredQuests.length > 1 ? "missions" : "mission"}
            </span>
          </div>

          {/* ==================================================
              LISTE DES QUÊTES
              ================================================== */}

          {filteredQuests.length === 0 ? (
            <div className="rounded-xl border border-amber-500/15 bg-[#08291c]/90 p-10 text-center">
              <p className="text-gray-300">
                Aucune quête ne correspond à ce filtre.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredQuests.map((quest) => (
                <QuestListItem
                  key={quest.questId}
                  quest={quest}
                  userQuest={getUserQuest(quest.questId)}
                  status={getQuestStatus(quest)}
                  prerequisitesOk={prerequisitesCompleted(quest)}
                  loading={actionLoading === quest.questId}
                  onStart={startQuest}
                  onComplete={completeQuest}
                  getObjectiveProgress={getObjectiveProgress}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

/* ============================================================
   STAT CARD
   ============================================================ */

function StatCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: number;
}) {
  return (
    <article className="flex min-h-28 items-center gap-4 rounded-xl border border-amber-500/25 bg-[#08291c]/95 px-5 py-4 shadow-lg">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center">
        <img
          src={icon}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-contain"
        />
      </div>

      <div>
        <p className="text-sm text-gray-300">{label}</p>
        <p className="mt-1 text-3xl font-bold text-amber-500">
          {value}
        </p>
      </div>
    </article>
  );
}

/* ============================================================
   FILTER BUTTON
   ============================================================ */

function FilterButton({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "flex min-h-11 items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition",
        active
          ? "border-amber-500/40 bg-[#123f2b] text-amber-300 shadow-inner"
          : "border-transparent text-gray-300 hover:border-amber-500/20 hover:bg-[#0d3524] hover:text-white",
      ].join(" ")}
    >
      <span>{label}</span>
      <span
        className={[
          "rounded-full px-2 py-0.5 text-xs",
          active
            ? "bg-amber-500/15 text-amber-300"
            : "bg-white/5 text-gray-400",
        ].join(" ")}
      >
        {count}
      </span>
    </button>
  );
}

/* ============================================================
   QUEST LIST ITEM
   ============================================================ */

function QuestListItem({
  quest,
  userQuest,
  status,
  prerequisitesOk,
  loading,
  onStart,
  onComplete,
  getObjectiveProgress,
}: {
  quest: Quest;
  userQuest?: UserQuest;
  status: QuestStatus;
  prerequisitesOk: boolean;
  loading: boolean;
  onStart: (questId: string) => void;
  onComplete: (questId: string) => void;
  getObjectiveProgress: (
    quest: Quest,
    objective: QuestObjective
  ) => { current: number; completed: boolean };
}) {
  const statusConfig = {
    available: {
      label: "Disponible",
      asset: QUEST_STATUS_ASSETS.available,
      badge:
        "border-amber-500/30 bg-amber-950/50 text-amber-300",
    },
    active: {
      label: "En cours",
      asset: QUEST_STATUS_ASSETS.active,
      badge:
        "border-blue-500/30 bg-blue-950/50 text-blue-300",
    },
    completed: {
      label: "Terminée",
      asset: QUEST_STATUS_ASSETS.completed,
      badge:
        "border-green-500/30 bg-green-950/50 text-green-300",
    },
  }[status];

  const rewards: string[] = [];

  if (quest.rewardXp && quest.rewardXp > 0) {
    rewards.push(`${quest.rewardXp} XP`);
  }

  if (quest.rewardAmount && quest.rewardAmount > 0) {
    rewards.push(
      `${quest.rewardAmount} ${quest.rewardCurrencyId || "monnaie"}`
    );
  }

  if (quest.rewardAchievementId) {
    rewards.push("Succès");
  }

  const objectives = Array.isArray(quest.objectives)
    ? quest.objectives
    : [];

  const completedObjectives = objectives.filter((objective) => {
    const progress = getObjectiveProgress(quest, objective);
    return progress.completed;
  }).length;

  const totalObjectives = objectives.length;

  return (
    <article className="overflow-hidden rounded-xl border border-amber-500/20 bg-[#08291c]/95 shadow-lg transition hover:border-amber-500/35 hover:shadow-xl">
      <div className="grid min-h-[170px]" style={{ gridTemplateColumns: "25% minmax(0, 1fr) 25%" }}>

        {/* ==================================================
            IMAGE — 1/4 DE LA FICHE
            ================================================== */}

        <div className="relative min-w-0 p-3 lg:p-3.5">
          <div className="relative flex h-[180px] w-full items-center justify-center overflow-hidden rounded-lg border border-amber-500/15 bg-[#04180f] lg:h-full lg:min-h-[150px]">
            {quest.imageUrl ? (
              <img
                src={quest.imageUrl}
                alt=""
                className="h-full w-full object-contain object-center"
              />
            ) : (
              <div className="relative h-full w-full bg-gradient-to-br from-[#173d2b] via-[#0d3022] to-[#03170e]">
                <div className="absolute left-3 top-3 flex h-20 w-20 items-center justify-center">
                  <img
                    src={statusConfig.asset}
                    alt=""
                    aria-hidden="true"
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
            )}

            {/* ==================================================
                ÉTAT — ICÔNE SUR L'IMAGE
                ================================================== */}
            <div
              className="absolute z-10 flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#04180f]/70 p-1 shadow-lg backdrop-blur-sm"
              style={{
                left: "12px",
                top: "12px",
                right: "auto",
                bottom: "auto",
                transform: "none",
              }}
              title={statusConfig.label}
              aria-label={`État : ${statusConfig.label}`}
            >
              <img
                src={statusConfig.asset}
                alt={statusConfig.label}
                className="!h-full !w-full object-contain"
              />
            </div>
          </div>
        </div>

        {/* ==================================================
            INFORMATIONS — 2/4 DE LA FICHE
            ================================================== */}

        <div className="min-w-0 border-l border-amber-500/10 px-5 py-4 lg:px-5 lg:py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-amber-500">
                Quête principale
              </p>

              <h3 className="mt-1 text-lg font-bold leading-tight text-white sm:text-xl">
                {quest.name}
              </h3>
            </div>
          </div>

          <p className="mt-2 line-clamp-2 text-sm leading-5 text-gray-300">
            {quest.description || "Aucune description disponible."}
          </p>

          {rewards.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {rewards.map((reward) => (
                <span
                  key={reward}
                  className="rounded-md border border-amber-500/20 bg-amber-950/40 px-2.5 py-1 text-xs font-semibold text-amber-300"
                >
                  {reward}
                </span>
              ))}
            </div>
          )}

          {status === "active" && totalObjectives > 0 && (
            <div className="mt-3 max-w-xl">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="uppercase tracking-wider text-gray-400">
                  Progression
                </span>

                <span className="font-semibold text-amber-300">
                  {completedObjectives}/{totalObjectives}
                </span>
              </div>

              <div className="h-1.5 overflow-hidden rounded-full bg-black/40">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all"
                  style={{
                    width: `${
                      totalObjectives > 0
                        ? Math.round(
                            (completedObjectives / totalObjectives) * 100
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ==================================================
            ACTIONS
            ================================================== */}

        {/* ==================================================
            ACTIONS — 1/4 DE LA FICHE
            ================================================== */}

        <div className="flex min-w-0 flex-col justify-center gap-2 border-l border-amber-500/10 p-3 lg:p-3.5">
          <Link
            href={`/quetes/${encodeURIComponent(
              quest.questId
            )}`}
            className="flex min-h-10 items-center justify-center rounded-lg border border-amber-500/25 bg-[#0a2b1d] px-3 py-2 text-sm font-semibold text-gray-100 transition hover:border-amber-500/50 hover:bg-[#103b28] hover:text-amber-200"
          >
            Voir les détails
          </Link>

          {status === "available" && (
            <>
              {!prerequisitesOk ? (
                <p className="rounded-lg border border-amber-500/15 bg-amber-950/20 p-2 text-center text-xs leading-4 text-amber-300">
                  Quête précédente requise.
                </p>
              ) : (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => onStart(quest.questId)}
                  className="min-h-10 rounded-lg border border-amber-400/50 bg-amber-600 px-3 py-2 text-sm font-semibold text-black shadow-md transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Démarrage..." : "Commencer"}
                </button>
              )}
            </>
          )}

          {status === "active" && (
            <button
              type="button"
              disabled={loading}
              onClick={() => onComplete(quest.questId)}
              className="min-h-10 rounded-lg border border-amber-400/50 bg-amber-600 px-3 py-2 text-sm font-semibold text-black shadow-md transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Validation..." : "Terminer"}
            </button>
          )}

          {status === "completed" && (
            <span className="text-center text-xs font-semibold text-green-400">
              Quête accomplie ✓
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
