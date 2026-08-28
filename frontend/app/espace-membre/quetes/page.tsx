"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";

import {
  completeQuest,
  getQuests,
  getUserQuests,
  startQuest,
} from "@/services/quests.service";

import QuestCard from "@/components/member/quests/QuestCard";

import type {
  QuestDefinition,
  UserQuest,
} from "@/types/quests.types";

export default function QuetesPage() {
  const router = useRouter();

  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
  } = useAuth();

  const [quests, setQuests] = useState<
    QuestDefinition[]
  >([]);

  const [userQuests, setUserQuests] = useState<
    UserQuest[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /* =========================================================
     AUTHENTIFICATION
     ========================================================= */

  useEffect(() => {
    if (
      !authLoading &&
      !isAuthenticated
    ) {
      router.replace("/connexion");
    }
  }, [
    authLoading,
    isAuthenticated,
    router,
  ]);

  /* =========================================================
     CHARGEMENT DES QUÊTES
     ========================================================= */

  const loadQuests = useCallback(
    async () => {
      if (!user) {
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [
          questsData,
          userQuestsData,
        ] = await Promise.all([
          getQuests(),
          getUserQuests(user.id),
        ]);

        setQuests(
          questsData.filter(
            (quest) => quest.enabled
          )
        );

        setUserQuests(
          userQuestsData
        );
      } catch (err) {
        console.error(
          "Erreur récupération des quêtes :",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Impossible de récupérer les quêtes."
        );
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  useEffect(() => {
    if (
      !authLoading &&
      isAuthenticated &&
      user
    ) {
      loadQuests();
    }
  }, [
    authLoading,
    isAuthenticated,
    user,
    loadQuests,
  ]);

  /* =========================================================
     DÉMARRER UNE QUÊTE
     ========================================================= */

  const handleStartQuest = async (
    questId: string
  ) => {
    if (!user) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      await startQuest(
        user.id,
        questId
      );

      setSuccess(
        "La quête a été commencée avec succès."
      );

      await loadQuests();
    } catch (err) {
      console.error(
        "Erreur démarrage quête :",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Impossible de démarrer la quête."
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* =========================================================
     TERMINER UNE QUÊTE
     ========================================================= */

  const handleCompleteQuest = async (
    questId: string
  ) => {
    if (!user) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      await completeQuest(
        user.id,
        questId
      );

      setSuccess(
        "Quête terminée avec succès. Vos récompenses ont été attribuées."
      );

      await loadQuests();
    } catch (err) {
      console.error(
        "Erreur validation quête :",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Impossible de terminer la quête."
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* =========================================================
     ÉTATS DE CHARGEMENT / AUTH
     ========================================================= */

  if (authLoading) {
    return (
      <main
        className="relative min-h-screen overflow-hidden bg-[#07150f] text-white"
        style={{
            backgroundImage: "url('/images/backgrounds/quetes-background.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            backgroundAttachment: 'fixed',
        }}
        >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(3,14,9,0.48),rgba(3,14,9,0.62)_45%,rgba(3,14,9,0.80)_100%)]" />
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-12"></div>
        <div className="mx-auto max-w-7xl px-6 py-12">
          <p className="text-gray-300">
            Chargement de votre domaine...
          </p>
        </div>
      </main>
    );
  }

  if (
    !isAuthenticated ||
    !user
  ) {
    return null;
  }

  /* =========================================================
     STATISTIQUES
     ========================================================= */

  const activeQuests =
    userQuests.filter(
      (quest) =>
        quest.status === "active"
    ).length;

  const completedQuests =
    userQuests.filter(
      (quest) =>
        quest.status === "completed"
    ).length;

  const availableQuests =
    quests.filter(
      (quest) =>
        !userQuests.some(
          (userQuest) =>
            userQuest.questId ===
            quest.questId
        )
    ).length;

  /* =========================================================
     AFFICHAGE
     ========================================================= */

  return (
    <main
        className="relative min-h-screen overflow-hidden bg-[#07150f] text-white"
        style={{
            backgroundImage:
            "url('/images/backgrounds/quetes-background.png')",
            backgroundSize: "cover",
            backgroundPosition: "center top",
            backgroundAttachment: "fixed",
        }}
        >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(3,14,9,0.48),rgba(3,14,9,0.62)_45%,rgba(3,14,9,0.80)_100%)]" />
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-12"></div>
      <div className="mx-auto max-w-7xl px-6 py-12">

        {/* =================================================
            EN-TÊTE
            ================================================= */}

        <header className="mb-10">
          <p className="mb-2 text-sm uppercase tracking-[0.3em] text-amber-500">
            Le Pacte du Chêne
          </p>

          <h1 className="text-4xl font-bold">
            Quêtes
          </h1>

          <p className="mt-3 max-w-2xl text-gray-300">
            Accomplissez les missions confiées
            aux membres du Pacte et faites
            progresser votre réputation.
          </p>
        </header>

        {/* =================================================
            MESSAGES
            ================================================= */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-900/30 p-4 text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl border border-green-500/20 bg-green-900/30 p-4 text-green-300">
            {success}
          </div>
        )}

        {/* =================================================
            RÉSUMÉ
            ================================================= */}

        {!loading && !error && (
          <section className="mb-10 grid gap-6 md:grid-cols-3">

            <article className="rounded-xl border border-white/10 bg-black/20 p-6">
              <p className="text-sm text-gray-400">
                Quêtes disponibles
              </p>

              <p className="mt-2 text-3xl font-bold text-amber-500">
                {availableQuests}
              </p>
            </article>

            <article className="rounded-xl border border-white/10 bg-black/20 p-6">
              <p className="text-sm text-gray-400">
                Quêtes en cours
              </p>

              <p className="mt-2 text-3xl font-bold text-amber-500">
                {activeQuests}
              </p>
            </article>

            <article className="rounded-xl border border-white/10 bg-black/20 p-6">
              <p className="text-sm text-gray-400">
                Quêtes terminées
              </p>

              <p className="mt-2 text-3xl font-bold text-amber-500">
                {completedQuests}
              </p>
            </article>

          </section>
        )}

        {/* =================================================
            CHARGEMENT
            ================================================= */}

        {loading && (
          <section className="rounded-xl border border-white/10 bg-black/20 p-8">
            <p className="text-center text-gray-400">
              Chargement des quêtes...
            </p>
          </section>
        )}

        {/* =================================================
            AUCUNE QUÊTE
            ================================================= */}

        {!loading &&
          !error &&
          quests.length === 0 && (
            <section className="rounded-xl border border-white/10 bg-black/20 p-8">
              <h2 className="text-xl font-bold">
                Aucune quête disponible
              </h2>

              <p className="mt-2 text-gray-400">
                Aucune quête n'est actuellement
                proposée aux membres du Pacte.
              </p>
            </section>
          )}

        {/* =================================================
            QUÊTES
            ================================================= */}

        {!loading &&
          !error &&
          quests.length > 0 && (
            <section>
              <div className="mb-6">
                <h2 className="text-2xl font-bold">
                  Quêtes disponibles
                </h2>

                <p className="mt-2 text-gray-400">
                  Choisissez une quête et
                  accomplissez ses objectifs.
                </p>
              </div>

              <div className="space-y-8">

                {quests.map((quest) => {
                  const userQuest =
                    userQuests.find(
                      (item) =>
                        item.questId ===
                        quest.questId
                    );

                  return (
                    <QuestCard
                      key={quest.questId}
                      quest={quest}
                      userQuest={userQuest}
                      userId={user.id}
                      onStart={
                        handleStartQuest
                      }
                      onComplete={
                        handleCompleteQuest
                      }
                      onRefresh={
                        loadQuests
                      }
                      loading={
                        actionLoading
                      }
                    />
                  );
                })}

              </div>
            </section>
          )}

        {/* =================================================
            HISTORIQUE DES QUÊTES
            ================================================= */}

        {!loading &&
          !error &&
          userQuests.length > 0 && (
            <section className="mt-12">

              <div className="mb-6">
                <h2 className="text-2xl font-bold">
                  Mon historique
                </h2>

                <p className="mt-2 text-gray-400">
                  Retrouvez les quêtes que vous
                  avez commencées ou accomplies.
                </p>
              </div>

              <div className="space-y-4">

                {userQuests.map(
                  (userQuest) => {
                    const quest =
                      quests.find(
                        (item) =>
                          item.questId ===
                          userQuest.questId
                      );

                    return (
                      <article
                        key={`${userQuest.userId}-${userQuest.questId}`}
                        className="rounded-xl border border-white/10 bg-black/20 p-5"
                      >
                        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

                          <div>
                            <h3 className="font-semibold">
                              {quest?.name ??
                                userQuest.questId}
                            </h3>

                            <p className="mt-1 text-sm text-gray-400">
                              {userQuest.status ===
                              "completed"
                                ? "Quête terminée"
                                : "Quête en cours"}
                            </p>
                          </div>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              userQuest.status ===
                              "completed"
                                ? "bg-green-900/50 text-green-300"
                                : "bg-amber-900/50 text-amber-300"
                            }`}
                          >
                            {userQuest.status ===
                            "completed"
                              ? "Terminée"
                              : "En cours"}
                          </span>

                        </div>
                      </article>
                    );
                  }
                )}

              </div>
            </section>
          )}

      </div>
    </main>
  );
}