"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

interface DiscordRole {
  id: string;
  name: string;
  color?: number;
}

interface DiscordLink {
  memberId: string;
  discordId: string;
  discordUsername?: string;
  linkedAt?: string;
  updatedAt?: string;
}

interface DiscordProfile {
  linked: boolean;
  inGuild: boolean;
  discordId: string;
  username?: string;
  globalName?: string | null;
  displayName?: string;
  nickname?: string | null;
  avatarUrl?: string | null;
  guildAvatarUrl?: string | null;
  joinedAt?: string | null;
  roles: DiscordRole[];
  link?: DiscordLink | null;
}

interface DiscordResponse {
  success: boolean;
  data: DiscordProfile | null;
  message?: string;
}

export default function DiscordPage() {
  const router = useRouter();

  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
  } = useAuth();

  const [profile, setProfile] =
    useState<DiscordProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /**
   * ==========================================================
   * CHARGEMENT DU PROFIL DISCORD
   * ==========================================================
   */

  const loadDiscordProfile = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/discord/me`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const payload: DiscordResponse =
          await response.json();

        if (!response.ok || !payload.success) {
          throw new Error(
            payload.message ||
              `Erreur serveur (${response.status}).`
          );
        }

        setProfile(payload.data);
      } catch (err) {
        console.error(
          "Erreur récupération profil Discord :",
          err
        );

        setProfile(null);

        setError(
          err instanceof Error
            ? err.message
            : "Impossible de récupérer votre profil Discord."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * ==========================================================
   * VÉRIFICATION AUTHENTIFICATION
   * ==========================================================
   */

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

  /**
   * ==========================================================
   * CHARGEMENT INITIAL
   * ==========================================================
   */

  useEffect(() => {
    if (
      authLoading ||
      !isAuthenticated ||
      !user
    ) {
      return;
    }

    loadDiscordProfile();
  }, [
    authLoading,
    isAuthenticated,
    user,
    loadDiscordProfile,
  ]);

  /**
   * ==========================================================
   * FORMATAGE DES DATES
   * ==========================================================
   */

  function formatDate(
    value?: string | null
  ): string {
    if (!value) {
      return "Date inconnue";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Date inconnue";
    }

    return date.toLocaleDateString(
      "fr-FR",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );
  }

  /**
   * ==========================================================
   * CHARGEMENT
   * ==========================================================
   */

  if (
    authLoading ||
    loading
  ) {
    return (
      <main className="min-h-screen bg-green-950 px-6 py-12 text-white">
        <div className="mx-auto max-w-6xl">

          <div className="rounded-xl border border-green-800 bg-green-900/50 p-8">
            <p className="text-green-300">
              Chargement de votre profil Discord...
            </p>
          </div>

        </div>
      </main>
    );
  }

  /**
   * ==========================================================
   * NON CONNECTÉ
   * ==========================================================
   */

  if (
    !isAuthenticated ||
    !user
  ) {
    return null;
  }

  return (
    <main className="min-h-screen bg-green-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl">

        {/* ====================================================
            EN-TÊTE
        ==================================================== */}

        <header className="mb-10">

          <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-400">
            Le Pacte du Chêne
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            Discord
          </h1>

          <p className="mt-3 max-w-2xl text-green-300">
            Retrouvez ici les informations liées à
            votre compte Discord et à votre présence
            au sein du Pacte.
          </p>

        </header>

        {/* ====================================================
            ERREUR
        ==================================================== */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-700 bg-red-950/40 p-5 text-red-300">
            {error}
          </div>
        )}

        {/* ====================================================
            AUCUNE LIAISON
        ==================================================== */}

        {!profile && (
          <section className="rounded-xl border border-green-800 bg-green-900/50 p-8">

            <div className="flex flex-col items-center text-center">

              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-950 text-4xl">
                💬
              </div>

              <h2 className="mt-6 text-2xl font-bold">
                Aucun compte Discord lié
              </h2>

              <p className="mt-3 max-w-xl text-green-300">
                Votre compte du Pacte n'est actuellement
                associé à aucun compte Discord.
              </p>

              <p className="mt-4 max-w-xl text-sm text-green-400">
                La liaison est effectuée depuis le système
                de synchronisation Discord du Pacte.
              </p>

            </div>

          </section>
        )}

        {/* ====================================================
            PROFIL DISCORD
        ==================================================== */}

        {profile && (
          <div className="space-y-6">

            {/* ==================================================
                IDENTITÉ
            ================================================== */}

            <section className="overflow-hidden rounded-xl border border-green-800 bg-green-900/50">

              <div className="border-b border-green-800 bg-green-900/80 px-6 py-5">

                <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-400">
                  Identité Discord
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  Votre compte Discord
                </h2>

              </div>

              <div className="p-6 md:p-8">

                <div className="flex flex-col gap-6 sm:flex-row sm:items-center">

                  {/* Avatar */}

                  <div className="h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-indigo-500 bg-indigo-950">

                    {profile.guildAvatarUrl ||
                    profile.avatarUrl ? (
                      <img
                        src={
                          profile.guildAvatarUrl ||
                          profile.avatarUrl ||
                          ""
                        }
                        alt="Avatar Discord"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-indigo-300">
                        {(
                          profile.displayName ||
                          profile.username ||
                          "?"
                        )
                          .slice(0, 1)
                          .toUpperCase()}
                      </div>
                    )}

                  </div>

                  {/* Nom */}

                  <div className="min-w-0 flex-1">

                    <div className="flex flex-wrap items-center gap-3">

                      <h3 className="text-3xl font-bold text-white">
                        {profile.displayName ||
                          profile.username ||
                          "Utilisateur Discord"}
                      </h3>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          profile.inGuild
                            ? "bg-green-800 text-green-200"
                            : "bg-red-950 text-red-300"
                        }`}
                      >
                        {profile.inGuild
                          ? "Présent sur le serveur"
                          : "Absent du serveur"}
                      </span>

                    </div>

                    {profile.username && (
                      <p className="mt-2 text-lg text-indigo-300">
                        @{profile.username}
                      </p>
                    )}

                    {profile.globalName &&
                      profile.globalName !==
                        profile.username && (
                        <p className="mt-1 text-sm text-green-400">
                          Nom global :{" "}
                          {profile.globalName}
                        </p>
                      )}

                  </div>

                </div>

                {/* Informations */}

                <div className="mt-8 grid gap-4 md:grid-cols-2">

                  <div className="rounded-lg border border-green-800 bg-green-950/50 p-4">

                    <p className="text-xs font-bold uppercase tracking-wider text-green-500">
                      Identifiant Discord
                    </p>

                    <p className="mt-2 break-all font-mono text-sm text-white">
                      {profile.discordId}
                    </p>

                  </div>

                  <div className="rounded-lg border border-green-800 bg-green-950/50 p-4">

                    <p className="text-xs font-bold uppercase tracking-wider text-green-500">
                      Surnom sur le serveur
                    </p>

                    <p className="mt-2 text-white">
                      {profile.nickname ||
                        "Aucun surnom"}
                    </p>

                  </div>

                  <div className="rounded-lg border border-green-800 bg-green-950/50 p-4">

                    <p className="text-xs font-bold uppercase tracking-wider text-green-500">
                      Membre depuis
                    </p>

                    <p className="mt-2 text-white">
                      {formatDate(
                        profile.joinedAt
                      )}
                    </p>

                  </div>

                  <div className="rounded-lg border border-green-800 bg-green-950/50 p-4">

                    <p className="text-xs font-bold uppercase tracking-wider text-green-500">
                      Liaison Pacte
                    </p>

                    <p className="mt-2 text-green-300">
                      {profile.link?.linkedAt
                        ? `Lié le ${formatDate(
                            profile.link.linkedAt
                          )}`
                        : "Compte lié"}
                    </p>

                  </div>

                </div>

              </div>

            </section>

            {/* ==================================================
                RÔLES
            ================================================== */}

            <section className="rounded-xl border border-green-800 bg-green-900/50 p-6 md:p-8">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-400">
                    Votre présence
                  </p>

                  <h2 className="mt-1 text-2xl font-bold">
                    Rôles Discord
                  </h2>

                </div>

                <span className="text-3xl">
                  🛡️
                </span>

              </div>

              {profile.roles.length > 0 ? (
                <div className="mt-6 flex flex-wrap gap-3">

                  {profile.roles.map(
                    (role) => (
                      <span
                        key={role.id}
                        className="rounded-full border border-indigo-700 bg-indigo-950/70 px-4 py-2 text-sm font-semibold text-indigo-200"
                      >
                        {role.name}
                      </span>
                    )
                  )}

                </div>
              ) : (
                <p className="mt-6 text-green-400">
                  Aucun rôle Discord récupéré.
                </p>
              )}

            </section>

            {/* ==================================================
                COMMUNAUTÉ
            ================================================== */}

            <section className="rounded-xl border border-green-800 bg-green-900/50 p-6 md:p-8">

              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

                <div>

                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-400">
                    Communauté
                  </p>

                  <h2 className="mt-1 text-2xl font-bold">
                    Le serveur du Pacte
                  </h2>

                  <p className="mt-2 max-w-xl text-green-300">
                    Retrouvez les membres du Pacte,
                    les annonces, les événements et
                    les différents espaces de la communauté.
                  </p>

                </div>

                <a
                  href="https://discord.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-500"
                >
                  Ouvrir Discord
                </a>

              </div>

            </section>

            {/* ==================================================
                ACTUALISATION
            ================================================== */}

            <div className="flex justify-end">

              <button
                type="button"
                onClick={loadDiscordProfile}
                disabled={loading}
                className="rounded-lg border border-green-700 px-5 py-3 text-sm font-semibold text-green-200 transition hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Actualisation..."
                  : "Actualiser mon profil Discord"}
              </button>

            </div>

          </div>
        )}

      </div>
    </main>
  );
}