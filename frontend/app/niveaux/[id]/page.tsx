"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

interface HistoryEntry {
  action: "XP_ADD" | "XP_REMOVE" | "XP_SET" | "LEVEL_SET";
  amount?: number;
  source: "QUEST" | "ACHIEVEMENT" | "ADMIN";
  sourceId?: string;
  reason?: string;
  previousXp: number;
  newXp: number;
  previousLevel: number;
  newLevel: number;
  createdAt: string;
}

interface UserLevel {
  userId: string;
  xp: number;
  level: number;
  levelName: string;
  currentLevelXp: number;
  nextLevelXp: number | null;
  progressXp: number;
  progressPercent: number;
  history: HistoryEntry[];
}

export default function NiveauMembrePage() {
  const params = useParams();
  const router = useRouter();

  const id = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadUserLevel() {
    if (!id) {
      setError("Identifiant du membre introuvable.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/levels/user/${encodeURIComponent(String(id))}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur serveur (${response.status})`);
      }

      const payload = await response.json();

      const level = payload?.data?.level;

      if (!level) {
        throw new Error(
          "Les informations de niveau sont introuvables."
        );
      }

      setUserLevel(level);
    } catch (err) {
      console.error("Erreur chargement niveau membre :", err);

      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger le niveau du membre."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUserLevel();
  }, [id]);

  function formatNumber(value: number) {
    return value.toLocaleString("fr-FR");
  }

  function formatDate(date: string) {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleString("fr-FR");
  }

  function getActionLabel(action: HistoryEntry["action"]) {
    switch (action) {
      case "XP_ADD":
        return "XP ajoutée";

      case "XP_REMOVE":
        return "XP retirée";

      case "XP_SET":
        return "XP définie";

      case "LEVEL_SET":
        return "Niveau défini";

      default:
        return action;
    }
  }

  function getSourceLabel(source: HistoryEntry["source"]) {
    switch (source) {
      case "QUEST":
        return "Quête";

      case "ACHIEVEMENT":
        return "Succès";

      case "ADMIN":
        return "Administration";

      default:
        return source;
    }
  }

  return (
    <main className="min-h-screen bg-green-950 text-white px-6 py-10">
      <div className="max-w-6xl mx-auto">

        {/* Navigation */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() => router.push("/niveaux")}
            className="text-green-300 transition hover:text-white"
          >
            ← Retour aux niveaux
          </button>
        </div>

        {/* En-tête */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">

          <div>
            <p className="text-amber-400 font-bold uppercase tracking-[0.3em] text-sm">
              Le Pacte du Chêne
            </p>

            <h1 className="text-4xl font-bold mt-2">
              Progression du membre
            </h1>

            <p className="text-green-300 mt-2">
              Suivez l'expérience et le niveau de ce membre.
            </p>

            <p className="mt-3 text-xs text-green-500 break-all">
              Membre : {String(id)}
            </p>
          </div>

          <button
            type="button"
            onClick={loadUserLevel}
            disabled={loading}
            className="rounded-lg bg-amber-600 px-6 py-3 font-semibold transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Actualisation..." : "Actualiser"}
          </button>

        </div>

        {/* Erreur */}
        {error && (
          <div className="rounded-xl border border-red-500/50 bg-red-950/40 p-6">
            <h2 className="text-xl font-bold text-red-300">
              Impossible de charger la progression
            </h2>

            <p className="mt-2 text-red-200">
              {error}
            </p>

            <button
              type="button"
              onClick={loadUserLevel}
              className="mt-5 rounded-lg bg-red-600 px-5 py-2 font-semibold hover:bg-red-500"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Chargement */}
        {loading && !error && (
          <div className="rounded-xl border border-green-800 bg-green-900/40 p-10 text-center">
            <p className="text-green-300">
              Chargement de la progression...
            </p>
          </div>
        )}

        {/* Contenu */}
        {!loading && !error && userLevel && (
          <>
            {/* Carte niveau principal */}
            <section className="rounded-xl border border-green-700 bg-green-900/50 p-8">

              <div className="flex flex-col md:flex-row md:items-center gap-8">

                <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full border-4 border-amber-500 bg-green-950">
                  <div className="text-center">
                    <p className="text-xs uppercase tracking-wider text-green-400">
                      Niveau
                    </p>

                    <p className="text-5xl font-bold text-amber-400">
                      {userLevel.level}
                    </p>
                  </div>
                </div>

                <div className="flex-1">
                  <p className="text-sm uppercase tracking-wider text-amber-400">
                    Rang actuel
                  </p>

                  <h2 className="mt-1 text-3xl font-bold">
                    {userLevel.levelName}
                  </h2>

                  <p className="mt-3 text-green-300">
                    {formatNumber(userLevel.xp)} XP au total
                  </p>
                </div>

              </div>

              {/* Barre XP */}
              <div className="mt-10">

                <div className="flex justify-between text-sm mb-2">
                  <span className="text-green-300">
                    Progression
                  </span>

                  <span className="font-bold text-amber-400">
                    {userLevel.progressPercent}%
                  </span>
                </div>

                <div className="h-4 overflow-hidden rounded-full bg-green-950">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(0, userLevel.progressPercent)
                      )}%`,
                    }}
                  />
                </div>

                <div className="mt-3 flex justify-between text-xs text-green-400">
                  <span>
                    {formatNumber(userLevel.currentLevelXp)} XP
                  </span>

                  {userLevel.nextLevelXp !== null ? (
                    <span>
                      Prochain niveau :{" "}
                      {formatNumber(userLevel.nextLevelXp)} XP
                    </span>
                  ) : (
                    <span className="text-amber-400">
                      Niveau maximum atteint
                    </span>
                  )}
                </div>

              </div>
            </section>

            {/* Statistiques */}
            <section className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">

              <div className="rounded-xl border border-green-800 bg-green-900/40 p-6">
                <p className="text-sm text-green-400">
                  XP totale
                </p>

                <p className="mt-2 text-3xl font-bold text-amber-400">
                  {formatNumber(userLevel.xp)}
                </p>
              </div>

              <div className="rounded-xl border border-green-800 bg-green-900/40 p-6">
                <p className="text-sm text-green-400">
                  Niveau actuel
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {userLevel.level}
                </p>
              </div>

              <div className="rounded-xl border border-green-800 bg-green-900/40 p-6">
                <p className="text-sm text-green-400">
                  XP vers le prochain niveau
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {userLevel.nextLevelXp !== null
                    ? formatNumber(
                        Math.max(
                          0,
                          userLevel.nextLevelXp - userLevel.xp
                        )
                      )
                    : "—"}
                </p>
              </div>

            </section>

            {/* Historique */}
            <section className="mt-8 rounded-xl border border-green-800 bg-green-900/40 p-6">

              <div className="mb-6">
                <p className="text-sm uppercase tracking-wider text-amber-400">
                  Journal
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  Historique de progression
                </h2>
              </div>

              {userLevel.history.length === 0 ? (
                <div className="rounded-lg border border-green-800 bg-green-950/40 p-8 text-center">
                  <p className="text-green-300">
                    Aucune progression enregistrée pour le moment.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">

                  {[...userLevel.history]
                    .reverse()
                    .map((entry, index) => {

                      const isPositive =
                        entry.action === "XP_ADD" ||
                        entry.action === "LEVEL_SET";

                      return (
                        <article
                          key={`${entry.createdAt}-${index}`}
                          className="rounded-lg border border-green-800 bg-green-950/40 p-5"
                        >

                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                            <div>
                              <div className="flex flex-wrap items-center gap-3">

                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                    isPositive
                                      ? "bg-green-800 text-green-300"
                                      : "bg-red-950 text-red-300"
                                  }`}
                                >
                                  {getActionLabel(entry.action)}
                                </span>

                                <span className="text-xs text-amber-400">
                                  {getSourceLabel(entry.source)}
                                </span>

                              </div>

                              {entry.reason && (
                                <p className="mt-3 text-green-200">
                                  {entry.reason}
                                </p>
                              )}

                              <p className="mt-2 text-xs text-green-500">
                                {formatDate(entry.createdAt)}
                              </p>
                            </div>

                            <div className="text-right">

                              {entry.amount !== undefined && (
                                <p
                                  className={`text-xl font-bold ${
                                    isPositive
                                      ? "text-green-400"
                                      : "text-red-400"
                                  }`}
                                >
                                  {isPositive ? "+" : "-"}
                                  {formatNumber(
                                    Math.abs(entry.amount)
                                  )} XP
                                </p>
                              )}

                              <p className="mt-1 text-xs text-green-500">
                                {formatNumber(entry.previousXp)}
                                {" → "}
                                {formatNumber(entry.newXp)} XP
                              </p>

                              {entry.previousLevel !==
                                entry.newLevel && (
                                <p className="mt-1 text-xs text-amber-400">
                                  Niveau {entry.previousLevel}
                                  {" → "}
                                  Niveau {entry.newLevel}
                                </p>
                              )}

                            </div>

                          </div>

                        </article>
                      );
                    })}

                </div>
              )}

            </section>
          </>
        )}

      </div>
    </main>
  );
}