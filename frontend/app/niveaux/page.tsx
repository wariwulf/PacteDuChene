"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

interface Level {
  level: number;
  name: string;
  description?: string;
  requiredXp: number;
  enabled: boolean;
}

export default function NiveauxPage() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadLevels() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/levels`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Erreur serveur (${response.status})`);
      }

      const payload = await response.json();

      const data = Array.isArray(payload?.data?.levels)
        ? payload.data.levels
        : [];

      setLevels(data);
    } catch (err) {
      console.error("Erreur chargement niveaux :", err);

      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger les niveaux."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLevels();
  }, []);

  return (
    <main className="min-h-screen bg-green-950 text-white px-6 py-10">
      <div className="max-w-6xl mx-auto">

        {/* En-tête */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <p className="text-amber-400 font-bold uppercase tracking-[0.3em] text-sm">
              Le Pacte du Chêne
            </p>

            <h1 className="text-4xl font-bold mt-2">
              Niveaux
            </h1>

            <p className="text-green-300 mt-2">
              Découvrez les différents paliers de progression du Pacte.
            </p>
          </div>

          <button
            type="button"
            onClick={loadLevels}
            disabled={loading}
            className="rounded-lg bg-amber-600 px-6 py-3 font-semibold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Actualisation..." : "Actualiser"}
          </button>
        </div>

        {/* Erreur */}
        {error && (
          <div className="mb-8 rounded-lg border border-red-500/50 bg-red-950/40 p-5">
            <p className="font-semibold text-red-300">
              Impossible de charger les niveaux
            </p>

            <p className="mt-2 text-sm text-red-200">
              {error}
            </p>

            <button
              type="button"
              onClick={loadLevels}
              className="mt-4 rounded-lg bg-red-600 px-5 py-2 font-semibold hover:bg-red-500"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Chargement */}
        {loading && !error && (
          <div className="rounded-xl border border-green-800 bg-green-900/40 p-10 text-center">
            <p className="text-green-300">
              Chargement des niveaux...
            </p>
          </div>
        )}

        {/* Aucun niveau */}
        {!loading && !error && levels.length === 0 && (
          <div className="rounded-xl border border-green-800 bg-green-900/40 p-10 text-center">
            <div className="text-5xl mb-4">
              🌳
            </div>

            <h2 className="text-xl font-bold">
              Aucun niveau configuré
            </h2>

            <p className="mt-2 text-green-300">
              Les paliers de progression seront bientôt disponibles.
            </p>
          </div>
        )}

        {/* Liste */}
        {!loading && levels.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {levels.map((level) => (
              <article
                key={level.level}
                className={`rounded-xl border p-6 transition ${
                  level.enabled
                    ? "border-green-700 bg-green-900/50 hover:border-amber-500"
                    : "border-gray-700 bg-gray-900/40 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-4">

                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-amber-500 bg-green-950 text-xl font-bold text-amber-400">
                      {level.level}
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
                        Niveau {level.level}
                      </p>

                      <h2 className="text-xl font-bold">
                        {level.name}
                      </h2>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      level.enabled
                        ? "bg-green-800 text-green-300"
                        : "bg-gray-800 text-gray-400"
                    }`}
                  >
                    {level.enabled ? "Actif" : "Désactivé"}
                  </span>
                </div>

                <div className="mt-6 rounded-lg border border-green-800 bg-green-950/50 p-4">
                  <p className="text-xs uppercase tracking-wider text-green-400">
                    XP nécessaire
                  </p>

                  <p className="mt-1 text-2xl font-bold text-amber-400">
                    {level.requiredXp.toLocaleString("fr-FR")} XP
                  </p>
                </div>

                {level.description && (
                  <p className="mt-5 text-sm leading-6 text-green-300">
                    {level.description}
                  </p>
                )}
              </article>
            ))}

          </div>
        )}

      </div>
    </main>
  );
}