"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AchievementBadge, AchievementBadgeImage } from "../../../components/member/achievements/AchievementBadge";
import type { FeaturedUserAchievement } from "../../../types/achievements.types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type Member = {
  profile: {
    id: string;
    email?: string;
    username?: string;
    displayName?: string;
    avatar?: string;
    role?: string;
    status?: string;
  };

  discord?: {
    linked?: boolean;
    discordId?: string;
    username?: string;
    lastSyncAt?: string;
  };

  paxDei?: {
    characterName?: string;
    level?: number;
    lastSyncAt?: string;
  };

  economy?: {
    balance?: number;
  };

  achievements?: {
    featured?: FeaturedUserAchievement[];
  };
};

function extractMember(payload: any): Member | null {
  if (!payload) {
    return null;
  }

  if (payload.profile) {
    return payload;
  }

  if (payload.data?.profile) {
    return payload.data;
  }

  if (payload.member?.profile) {
    return payload.member;
  }

  if (payload.data?.member?.profile) {
    return payload.data.member;
  }

  return null;
}

function formatRole(role?: string) {
  if (!role) return "Membre";

  const roles: Record<string, string> = {
    admin: "Administrateur",
    administrator: "Administrateur",
    member: "Membre",
    user: "Membre",
    moderator: "Modérateur",
    leader: "Chef",
  };

  return roles[role.toLowerCase()] || role;
}

function formatStatus(status?: string) {
  if (!status) return "Inconnu";

  const statuses: Record<string, string> = {
    active: "Actif",
    inactive: "Inactif",
    banned: "Banni",
    suspended: "Suspendu",
  };

  return statuses[status.toLowerCase()] || status;
}

export default function MemberPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [featuredAchievements, setFeaturedAchievements] = useState<FeaturedUserAchievement[]>([]);

  useEffect(() => {
    if (!id) {
      setError("Identifiant du membre manquant.");
      setLoading(false);
      return;
    }

    loadMember();
  }, [id]);

  async function loadMember() {
    if (!id) {
      setError("Identifiant du membre manquant.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/members/${encodeURIComponent(id)}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "Vous devez être connecté pour consulter ce membre."
          );
        }

        if (response.status === 404) {
          throw new Error("Membre introuvable.");
        }

        throw new Error(
          `Erreur serveur (${response.status})`
        );
      }

      const payload = await response.json();

      console.log(
        "🌳 Pacte du Chêne - Membre :",
        payload
      );

      const normalizedMember =
        extractMember(payload);

      if (!normalizedMember) {
        throw new Error(
          "Les données du membre sont invalides."
        );
      }

      setMember(normalizedMember);

      try {
        const featuredResponse = await fetch(
          `${API_URL}/achievements/user/${encodeURIComponent(id)}/featured`,
          {
            credentials: "include",
            headers: { Accept: "application/json" },
            cache: "no-store",
          }
        );

        if (featuredResponse.ok) {
          const featuredPayload = await featuredResponse.json();
          setFeaturedAchievements(featuredPayload?.data?.achievements ?? []);
        } else {
          setFeaturedAchievements([]);
        }
      } catch {
        // La fiche membre reste utilisable même si les exploits mis en avant
        // ne sont pas encore disponibles.
        setFeaturedAchievements([]);
      }
    } catch (err) {
      console.error(
        "Erreur chargement membre :",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger ce membre."
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-green-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-5xl">
          <p className="text-green-300">
            Chargement du membre...
          </p>
        </div>
      </main>
    );
  }

  if (error || !member) {
    return (
      <main className="min-h-screen bg-green-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/membres"
            className="mb-6 inline-block text-sm text-amber-400 hover:text-amber-300"
          >
            ← Retour aux membres
          </Link>

          <div className="rounded-xl border border-red-500/40 bg-red-950/30 p-6">
            <h1 className="text-xl font-bold text-red-300">
              Membre introuvable
            </h1>

            <p className="mt-2 text-red-200">
              {error ||
                "Impossible de récupérer les informations de ce membre."}
            </p>

            <button
              type="button"
              onClick={loadMember}
              className="mt-5 rounded-lg bg-red-700 px-4 py-2 font-semibold hover:bg-red-600"
            >
              Réessayer
            </button>
          </div>
        </div>
      </main>
    );
  }

  const profile = member.profile;
  const discord = member.discord || {};
  const paxDei = member.paxDei || {};
  const economy = member.economy || {};

  const displayName =
    profile.displayName ||
    profile.username ||
    "Membre du Pacte";

  return (
    <main className="min-h-screen bg-green-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">

        <Link
          href="/membres"
          className="mb-8 inline-block text-sm font-semibold text-amber-400 transition hover:text-amber-300"
        >
          ← Retour aux membres
        </Link>

        <section className="mb-6 overflow-hidden rounded-2xl border border-green-800 bg-green-900/60">
          <div className="flex flex-col gap-6 p-8 md:flex-row md:items-center">

            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={displayName}
                className="h-28 w-28 rounded-full border-4 border-amber-600 object-cover"
              />
            ) : (
              <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-4 border-amber-600 bg-green-950 text-4xl font-bold text-amber-400">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex-1">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-amber-400">
                Membre du Pacte du Chêne
              </p>

              <h1 className="text-4xl font-bold">
                {displayName}
              </h1>

              {profile.username &&
                profile.username !== displayName && (
                  <p className="mt-1 text-green-300">
                    @{profile.username}
                  </p>
                )}

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-amber-900/40 px-3 py-1 text-sm font-semibold text-amber-300">
                  {formatRole(profile.role)}
                </span>

                <span className="rounded-full bg-green-800 px-3 py-1 text-sm font-semibold text-green-300">
                  {formatStatus(profile.status)}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-2xl border border-amber-700/30 bg-gradient-to-br from-amber-950/20 to-green-900/50 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-amber-400">
                Hauts faits
              </p>
              <h2 className="mt-1 text-2xl font-bold">Exploits mis en avant</h2>
              <p className="mt-1 text-sm text-green-300/70">
                Les trois exploits choisis par ce membre pour représenter son parcours.
              </p>
            </div>
            <span className="text-sm font-semibold text-amber-300">
              {featuredAchievements.length}/3
            </span>
          </div>

          {featuredAchievements.length > 0 ? (
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {featuredAchievements.slice(0, 3).map((achievement, index) => (
                <article
                  key={achievement.achievementId}
                  className="relative rounded-xl border border-amber-600/25 bg-black/20 p-5"
                >
                  <span className="absolute right-3 top-3 text-xs font-black text-amber-500/70">
                    #{index + 1}
                  </span>

                  <AchievementBadgeImage
                    level={achievement.level}
                    size={72}
                    priority={index === 0}
                  />

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold">{achievement.name}</h3>
                    <AchievementBadge level={achievement.level} compact />
                  </div>

                  {achievement.description && (
                    <p className="mt-2 text-sm leading-relaxed text-green-100/70">
                      {achievement.description}
                    </p>
                  )}

                  <p className="mt-3 text-xs text-green-400/70">
                    Obtenu le {new Date(achievement.unlockedAt).toLocaleDateString("fr-FR")}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-white/10 bg-black/10 p-6 text-center text-sm text-green-300/50">
              Ce membre n&apos;a pas encore choisi d&apos;exploit à mettre en avant.
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

          <section className="rounded-xl border border-green-800 bg-green-900/60 p-6">
            <h2 className="mb-5 text-xl font-bold text-amber-400">
              Profil
            </h2>

            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-green-400">
                  Identifiant
                </p>

                <p className="mt-1 break-all text-sm">
                  {profile.id}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-green-400">
                  Adresse e-mail
                </p>

                <p className="mt-1">
                  {profile.email || "Non renseignée"}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-green-400">
                  Rôle
                </p>

                <p className="mt-1">
                  {formatRole(profile.role)}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-green-400">
                  Statut
                </p>

                <p className="mt-1">
                  {formatStatus(profile.status)}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-green-800 bg-green-900/60 p-6">
            <h2 className="mb-5 text-xl font-bold text-amber-400">
              Pax Dei
            </h2>

            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-green-400">
                  Personnage
                </p>

                <p className="mt-1 text-lg font-semibold">
                  {paxDei.characterName ||
                    "Personnage non renseigné"}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-green-400">
                  Niveau
                </p>

                <p className="mt-1 text-lg font-semibold">
                  {paxDei.level ?? "Non renseigné"}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-green-800 bg-green-900/60 p-6">
            <h2 className="mb-5 text-xl font-bold text-amber-400">
              Discord
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-green-300">
                  Compte lié
                </span>

                <span
                  className={
                    discord.linked
                      ? "font-semibold text-green-400"
                      : "font-semibold text-gray-400"
                  }
                >
                  {discord.linked ? "Oui" : "Non"}
                </span>
              </div>

              {discord.linked && (
                <>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-green-400">
                      Nom Discord
                    </p>

                    <p className="mt-1">
                      {discord.username ||
                        "Non renseigné"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-green-400">
                      Discord ID
                    </p>

                    <p className="mt-1 break-all text-sm">
                      {discord.discordId ||
                        "Non renseigné"}
                    </p>
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-green-800 bg-green-900/60 p-6">
            <h2 className="mb-5 text-xl font-bold text-amber-400">
              Économie
            </h2>

            <div className="rounded-lg border border-amber-700/30 bg-amber-950/20 p-5">
              <p className="text-sm text-green-300">
                Solde actuel
              </p>

              <p className="mt-2 text-3xl font-bold text-amber-300">
                {economy.balance ?? 0}
              </p>

              <p className="mt-1 text-sm text-amber-500">
                solidus
              </p>
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-xl border border-green-800 bg-green-900/40 p-6">
          <h2 className="text-xl font-bold text-amber-400">
            Progression
          </h2>

          <p className="mt-2 text-green-300">
            Les quêtes, succès et inventaire du membre
            seront raccordés prochainement.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-green-800 bg-green-950/50 p-4">
              <p className="text-xs uppercase text-green-400">
                Quêtes
              </p>

              <p className="mt-2 font-semibold">
                Bientôt disponible
              </p>
            </div>

            <div className="rounded-lg border border-green-800 bg-green-950/50 p-4">
              <p className="text-xs uppercase text-green-400">
                Succès
              </p>

              <p className="mt-2 font-semibold">
                Bientôt disponible
              </p>
            </div>

            <div className="rounded-lg border border-green-800 bg-green-950/50 p-4">
              <p className="text-xs uppercase text-green-400">
                Inventaire
              </p>

              <p className="mt-2 font-semibold">
                Bientôt disponible
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}