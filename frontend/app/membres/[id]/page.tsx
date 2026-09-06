"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  AchievementBadge,
  AchievementBadgeImage,
} from "../../../components/member/achievements/AchievementBadge";
import type { FeaturedUserAchievement } from "../../../types/achievements.types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type Discipline = {
  name: string;
  level: number;
};

type CurrencyId = "solidus" | "argent" | "bronze";
type EconomyBalances = Record<CurrencyId, number>;

const EMPTY_BALANCES: EconomyBalances = {
  solidus: 0,
  argent: 0,
  bronze: 0,
};

function normalizeBalances(payload: any, fallbackBalance?: number): EconomyBalances {
  const balances =
    payload?.data?.balances ??
    payload?.balances ??
    payload?.data?.economy?.balances ??
    payload?.economy?.balances;

  if (balances && typeof balances === "object") {
    return {
      solidus: Number(balances.solidus ?? fallbackBalance ?? 0),
      argent: Number(balances.argent ?? 0),
      bronze: Number(balances.bronze ?? 0),
    };
  }

  return {
    ...EMPTY_BALANCES,
    solidus: Number(fallbackBalance ?? 0),
  };
}

type Character = {
  _id?: string;
  memberId: string;
  characterName: string;
  avatarId?: string;
  world?: string;
  province?: string;
  region?: string;
  clan?: string;
  disciplines?: Discipline[];
  mainProfession?: string;
  secondaryProfessions?: string[];
  combatRole?: "TANK" | "HEAL" | "DPS";
  specialization?: string;
  chronicleTitle?: string;
  chronicle?: string;
  isMainCharacter?: boolean;
};

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
    balances?: Partial<EconomyBalances>;
  };
  achievements?: {
    featured?: FeaturedUserAchievement[];
  };
};

type QuestLike = {
  status?: string;
  state?: string;
  completed?: boolean;
};

function extractMember(payload: any): Member | null {
  if (!payload) return null;
  if (payload.profile) return payload;
  if (payload.data?.profile) return payload.data;
  if (payload.member?.profile) return payload.member;
  if (payload.data?.member?.profile) return payload.data.member;
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
    owner: "Fondateur",
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

function roleLabel(role?: Character["combatRole"]) {
  if (role === "TANK") return "Tank";
  if (role === "HEAL") return "Soigneur";
  if (role === "DPS") return "DPS";
  return "Non renseigné";
}

function roleIcon(role?: Character["combatRole"]) {
  if (role === "TANK") return "🛡️";
  if (role === "HEAL") return "✚";
  return "⚔️";
}

function extractArray(payload: any, keys: string[]): any[] {
  for (const key of keys) {
    if (Array.isArray(payload?.data?.[key])) return payload.data[key];
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <div className="rounded-xl border border-green-800/80 bg-green-950/50 p-4">
      <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.18em] text-green-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-amber-300">{value}</p>
      {detail && <p className="mt-1 text-xs text-green-400">{detail}</p>}
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value?: string | number;
}) {
  return (
    <div>
      <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-green-500">
        {label}
      </p>
      <p className="mt-1 font-semibold text-green-100">
        {value === undefined || value === "" ? "Non renseigné" : value}
      </p>
    </div>
  );
}

export default function MemberPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [member, setMember] = useState<Member | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [economyBalances, setEconomyBalances] =
    useState<EconomyBalances>(EMPTY_BALANCES);
  const [featuredAchievements, setFeaturedAchievements] = useState<
    FeaturedUserAchievement[]
  >([]);
  const [quests, setQuests] = useState<QuestLike[]>([]);
  const [pacteLevel, setPacteLevel] = useState<{
    level: number;
    levelName: string;
    xp: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setError("Identifiant du membre manquant.");
      setLoading(false);
      return;
    }

    loadMember();
  }, [id]);

  async function loadMember() {
    if (!id) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/members/${encodeURIComponent(id)}`,
        {
          credentials: "include",
          headers: { Accept: "application/json" },
          cache: "no-store",
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
        throw new Error(`Erreur serveur (${response.status})`);
      }

      const payload = await response.json();
      const normalizedMember = extractMember(payload);

      if (!normalizedMember) {
        throw new Error("Les données du membre sont invalides.");
      }

      setMember(normalizedMember);

      // Ces trois blocs utilisent les routes déjà présentes dans le projet.
      // Une panne sur une donnée secondaire ne doit pas empêcher la fiche
      // principale de s'afficher.
      const [
        charactersResult,
        achievementsResult,
        questsResult,
        economyResult,
        levelResult,
      ] = await Promise.allSettled([
          fetch(
            `${API_URL}/paxdei/characters/member/${encodeURIComponent(id)}`,
            {
              credentials: "include",
              headers: { Accept: "application/json" },
              cache: "no-store",
            }
          ),
          fetch(
            `${API_URL}/achievements/user/${encodeURIComponent(id)}/featured`,
            {
              credentials: "include",
              headers: { Accept: "application/json" },
              cache: "no-store",
            }
          ),
          fetch(`${API_URL}/quests/user/${encodeURIComponent(id)}`, {
            credentials: "include",
            headers: { Accept: "application/json" },
            cache: "no-store",
          }),
          fetch(`${API_URL}/economy/${encodeURIComponent(id)}`, {
            credentials: "include",
            headers: { Accept: "application/json" },
            cache: "no-store",
          }),
          fetch(`${API_URL}/levels/user/${encodeURIComponent(id)}`, {
            credentials: "include",
            headers: { Accept: "application/json" },
            cache: "no-store",
          }),
        ]);

      if (
        charactersResult.status === "fulfilled" &&
        charactersResult.value.ok
      ) {
        const characterPayload = await charactersResult.value
          .json()
          .catch(() => ({}));
        setCharacters(extractArray(characterPayload, ["characters"]));
      } else {
        setCharacters([]);
      }

      if (
        achievementsResult.status === "fulfilled" &&
        achievementsResult.value.ok
      ) {
        const achievementPayload = await achievementsResult.value
          .json()
          .catch(() => ({}));
        setFeaturedAchievements(
          extractArray(achievementPayload, ["achievements"]).slice(0, 3)
        );
      } else {
        setFeaturedAchievements([]);
      }

      if (questsResult.status === "fulfilled" && questsResult.value.ok) {
        const questPayload = await questsResult.value
          .json()
          .catch(() => ({}));
        setQuests(extractArray(questPayload, ["quests"]));
      } else {
        setQuests([]);
      }

      if (economyResult.status === "fulfilled" && economyResult.value.ok) {
        const economyPayload = await economyResult.value
          .json()
          .catch(() => ({}));
        setEconomyBalances(
          normalizeBalances(economyPayload, normalizedMember.economy?.balance)
        );
      } else {
        setEconomyBalances(
          normalizeBalances(undefined, normalizedMember.economy?.balance)
        );
      }

      if (levelResult.status === "fulfilled" && levelResult.value.ok) {
        const levelPayload = await levelResult.value
          .json()
          .catch(() => ({}));
        const level = levelPayload?.data?.level ?? levelPayload?.level;

        if (
          Number.isFinite(Number(level?.level)) &&
          typeof level?.levelName === "string"
        ) {
          setPacteLevel({
            level: Number(level.level),
            levelName: level.levelName,
            xp: Number(level.xp ?? 0),
          });
        } else {
          setPacteLevel(null);
        }
      } else {
        setPacteLevel(null);
      }
    } catch (err) {
      console.error("Erreur chargement membre :", err);
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger ce membre."
      );
    } finally {
      setLoading(false);
    }
  }

  const mainCharacter = useMemo(
    () =>
      characters.find((character) => character.isMainCharacter) ??
      characters[0] ??
      null,
    [characters]
  );

  const completedQuests = useMemo(
    () =>
      quests.filter(
        (quest) =>
          quest.completed === true ||
          ["completed", "complete", "done", "finished"].includes(
            String(quest.status ?? quest.state ?? "").toLowerCase()
          )
      ).length,
    [quests]
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-[#031b0e] px-5 py-12 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="text-green-300">Les registres du Pacte s'ouvrent...</p>
        </div>
      </main>
    );
  }

  if (error || !member) {
    return (
      <main className="min-h-screen bg-[#031b0e] px-5 py-12 text-white">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/clan"
            className="mb-6 inline-block text-sm font-semibold text-amber-400 hover:text-amber-300"
          >
            ← Retour à l'Arbre du Clan
          </Link>

          <div className="rounded-2xl border border-red-700/50 bg-red-950/30 p-7">
            <h1 className="text-2xl font-bold text-red-300">
              Membre introuvable
            </h1>
            <p className="mt-2 text-red-200">
              {error || "Impossible de récupérer les informations de ce membre."}
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
  const displayName =
    profile.displayName || profile.username || "Membre du Pacte";

  return (
    <main className="min-h-screen bg-[#031b0e] px-4 py-8 text-white sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/clan"
            className="text-sm font-semibold text-amber-400 transition hover:text-amber-300"
          >
            ← Retour à l'Arbre du Clan
          </Link>

          <Link
            href="/membres"
            className="text-sm text-green-300 transition hover:text-amber-300"
          >
            Registre des membres →
          </Link>
        </div>

        {/* En-tête du registre */}
        <section className="relative mb-6 overflow-hidden rounded-2xl border border-amber-700/60 bg-gradient-to-br from-green-900 via-green-950 to-[#02140a] shadow-2xl">
          <div className="pointer-events-none absolute inset-0 opacity-30">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border border-amber-500/30" />
            <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full border border-amber-500/20" />
          </div>

          <div className="relative flex flex-col gap-6 p-6 sm:p-8 md:flex-row md:items-center">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={`Portrait de ${displayName}`}
                className="h-32 w-32 shrink-0 rounded-full border-4 border-amber-600 object-cover shadow-xl"
              />
            ) : (
              <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full border-4 border-amber-600 bg-green-950 text-5xl font-bold text-amber-400 shadow-xl">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-amber-400">
                Registre du Pacte du Chêne
              </p>

              <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
                {displayName}
              </h1>

              {profile.username && profile.username !== displayName && (
                <p className="mt-1 text-green-300">@{profile.username}</p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-amber-600/40 bg-amber-950/40 px-3 py-1 text-sm font-bold text-amber-300">
                  {formatRole(profile.role)}
                </span>
                <span className="rounded-full border border-green-700 bg-green-950/60 px-3 py-1 text-sm font-semibold text-green-300">
                  {formatStatus(profile.status)}
                </span>
                {pacteLevel && (
                  <span
                    className="rounded-full border border-amber-500/40 bg-amber-950/30 px-3 py-1 text-sm font-bold text-amber-300"
                    title={`${pacteLevel.xp.toLocaleString("fr-FR")} XP du Pacte`}
                  >
                    Niveau {pacteLevel.level} · {pacteLevel.levelName}
                  </span>
                )}
                {mainCharacter && (
                  <span className="rounded-full border border-green-700 bg-green-950/60 px-3 py-1 text-sm font-semibold text-green-200">
                    {roleIcon(mainCharacter.combatRole)}{" "}
                    {roleLabel(mainCharacter.combatRole)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Vue d'ensemble */}
        <section className="mb-6">
          <div className="mb-3">
            <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-amber-400">
              Vue d'ensemble
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard
              label="Personnages"
              value={characters.length > 0 ? characters.length : "—"}
              detail={
                characters.length > 0
                  ? "Fiche(s) Pax Dei"
                  : "Aucun personnage renseigné"
              }
            />
            <StatCard
              label="Quêtes"
              value={completedQuests}
              detail={quests.length ? `sur ${quests.length} suivies` : "Données disponibles"}
            />
            <StatCard
              label="Exploits"
              value={featuredAchievements.length}
              detail="Mis en avant"
            />
            <div className="rounded-xl border border-amber-700/40 bg-green-950/50 p-4">
              <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.18em] text-green-400">
                Trésor
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-amber-600/20 bg-amber-950/20 p-2">
                  <p className="text-[0.6rem] font-bold uppercase tracking-wider text-amber-500">
                    Solidus
                  </p>
                  <p className="mt-1 text-lg font-black text-amber-300">
                    {economyBalances.solidus.toLocaleString("fr-FR")}
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                  <p className="text-[0.6rem] font-bold uppercase tracking-wider text-gray-400">
                    Argent
                  </p>
                  <p className="mt-1 text-lg font-black text-gray-200">
                    {economyBalances.argent.toLocaleString("fr-FR")}
                  </p>
                </div>
                <div className="rounded-lg border border-orange-700/20 bg-orange-950/20 p-2">
                  <p className="text-[0.6rem] font-bold uppercase tracking-wider text-orange-500">
                    Bronze
                  </p>
                  <p className="mt-1 text-lg font-black text-orange-300">
                    {economyBalances.bronze.toLocaleString("fr-FR")}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs text-green-500/80">Les trois monnaies du Pacte</p>
            </div>
          </div>
        </section>

        {/* Personnage Pax Dei */}
        <section className="mb-6 overflow-hidden rounded-2xl border border-green-800 bg-green-900/50 shadow-xl">
          <div className="border-b border-green-800 bg-green-950/40 px-6 py-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-amber-400">
              Registre Pax Dei
            </p>
            <h2 className="mt-1 text-2xl font-bold">Personnages</h2>
            <p className="mt-1 text-sm text-green-300">
              Les informations renseignées par le membre sur ses personnages.
            </p>
          </div>

          <div className="p-6">
            {characters.length === 0 ? (
              <div className="rounded-xl border border-dashed border-green-700 bg-green-950/40 p-7 text-center text-green-400">
                Aucun personnage Pax Dei détaillé n'est encore renseigné.
                {paxDei.characterName && (
                  <p className="mt-2 text-green-200">
                    Personnage déclaré :{" "}
                    <strong className="text-amber-300">
                      {paxDei.characterName}
                    </strong>
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-5">
                {characters.map((character) => (
                  <article
                    key={character._id ?? character.characterName}
                    className={`rounded-xl border p-5 ${
                      character.isMainCharacter
                        ? "border-amber-600/60 bg-amber-950/15"
                        : "border-green-800 bg-green-950/30"
                    }`}
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {character.isMainCharacter && (
                            <span className="rounded-full bg-amber-900/40 px-2.5 py-1 text-[0.68rem] font-extrabold uppercase tracking-wider text-amber-300">
                              Personnage principal
                            </span>
                          )}
                          <span className="text-xs font-bold uppercase tracking-wider text-green-500">
                            Pax Dei
                          </span>
                        </div>

                        <h3 className="mt-2 text-2xl font-bold text-white">
                          {character.characterName}
                        </h3>

                        {character.chronicleTitle && (
                          <p className="mt-1 text-sm italic text-amber-300">
                            « {character.chronicleTitle} »
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-3 rounded-xl border border-green-800 bg-green-950/60 px-4 py-3">
                        <span className="text-2xl">
                          {roleIcon(character.combatRole)}
                        </span>
                        <div>
                          <p className="text-[0.65rem] uppercase tracking-wider text-green-500">
                            Rôle
                          </p>
                          <p className="font-bold text-green-100">
                            {roleLabel(character.combatRole)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <Info label="Monde" value={character.world} />
                      <Info label="Province" value={character.province} />
                      <Info label="Région" value={character.region} />
                      <Info label="Clan" value={character.clan} />
                      <Info
                        label="Spécialisation"
                        value={character.specialization}
                      />
                      <Info
                        label="Profession principale"
                        value={character.mainProfession}
                      />
                      <Info
                        label="Secondaires"
                        value={
                          character.secondaryProfessions?.length
                            ? character.secondaryProfessions.join(", ")
                            : undefined
                        }
                      />
                      <Info label="Niveau" value={character.isMainCharacter ? paxDei.level : undefined} />
                    </div>

                    {character.disciplines?.length ? (
                      <div className="mt-6">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-green-400">
                            Disciplines
                          </p>
                          <span className="text-xs text-green-500">
                            {character.disciplines.length} renseignée
                            {character.disciplines.length > 1 ? "s" : ""}
                          </span>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {character.disciplines.map((discipline) => (
                            <div
                              key={discipline.name}
                              className="rounded-lg border border-green-800 bg-green-950/60 p-3"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-sm text-green-100">
                                  {discipline.name}
                                </span>
                                <span className="font-black text-amber-400">
                                  {discipline.level}
                                </span>
                              </div>
                              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-green-950">
                                <div
                                  className="h-full rounded-full bg-amber-500"
                                  style={{
                                    width: `${Math.max(
                                      0,
                                      Math.min(40, discipline.level)
                                    ) / 40 * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {character.chronicle && (
                      <div className="mt-6 rounded-xl border border-green-800 bg-green-950/40 p-4">
                        <p className="text-xs font-extrabold uppercase tracking-wider text-green-400">
                          Chronique
                        </p>
                        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-green-100/80">
                          {character.chronicle}
                        </p>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Exploits */}
        <section className="mb-6 rounded-2xl border border-amber-700/40 bg-gradient-to-br from-amber-950/20 to-green-900/50 p-6 shadow-xl">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-amber-400">
                Hauts faits
              </p>
              <h2 className="mt-1 text-2xl font-bold">Exploits mis en avant</h2>
            </div>
            <span className="text-sm font-semibold text-amber-300">
              {featuredAchievements.length}/3
            </span>
          </div>

          {featuredAchievements.length > 0 ? (
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {featuredAchievements.map((achievement, index) => (
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
                    Obtenu le{" "}
                    {new Date(achievement.unlockedAt).toLocaleDateString(
                      "fr-FR"
                    )}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-white/10 bg-black/10 p-6 text-center text-sm text-green-300/50">
              Ce membre n'a pas encore choisi d'exploit à mettre en avant.
            </div>
          )}
        </section>

        {/* Informations générales */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-green-800 bg-green-900/60 p-6 shadow-lg">
            <h2 className="mb-5 text-xl font-bold text-amber-400">Profil</h2>
            <div className="space-y-4">
              <Info label="Rôle du site" value={formatRole(profile.role)} />
              <Info
                label="Niveau du Pacte"
                value={
                  pacteLevel
                    ? `Niveau ${pacteLevel.level} · ${pacteLevel.levelName}`
                    : undefined
                }
              />
              <Info label="Statut" value={formatStatus(profile.status)} />
              <Info label="Identifiant" value={profile.id} />
              <Info label="Adresse e-mail" value={profile.email} />
            </div>
          </section>

          <section className="rounded-xl border border-green-800 bg-green-900/60 p-6 shadow-lg">
            <h2 className="mb-5 text-xl font-bold text-amber-400">Discord</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-green-300">Compte lié</span>
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
                  <Info label="Nom Discord" value={discord.username} />
                  <Info label="Discord ID" value={discord.discordId} />
                </>
              )}
            </div>
          </section>
        </div>

        {/* Progression */}
        <section className="mt-6 rounded-2xl border border-green-800 bg-green-900/40 p-6 shadow-xl">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-amber-400">
              Parcours
            </p>
            <h2 className="mt-1 text-2xl font-bold">Progression dans le Pacte</h2>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="Quêtes suivies"
              value={quests.length}
              detail={
                quests.length
                  ? `${completedQuests} terminée${completedQuests > 1 ? "s" : ""}`
                  : "Aucune donnée"
              }
            />
            <StatCard
              label="Exploits mis en avant"
              value={featuredAchievements.length}
              detail="Choisis par le membre"
            />
            <StatCard
              label="Personnage principal"
              value={mainCharacter?.characterName || "—"}
              detail={
                mainCharacter?.combatRole
                  ? roleLabel(mainCharacter.combatRole)
                  : "Pax Dei"
              }
            />
          </div>
        </section>

        <p className="mt-8 text-center text-xs text-green-500/70">
          Les informations Pax Dei sont déclarées par les membres du Pacte.
        </p>
      </div>
    </main>
  );
}
