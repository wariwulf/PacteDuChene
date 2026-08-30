"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getCurrentMember } from "@/services/members.service";
import MemberPageBackground from "@/components/member/MemberPageBackground";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type Member = {
  profile: {
    id: string;
    username: string;
    displayName?: string;
    avatar?: string;
    role: string;
    status?: string;
  };
  discord?: {
    linked?: boolean;
  };
};

type Level = {
  xp: number;
  level: number;
  levelName: string;
  currentLevelXp: number;
  nextLevelXp: number | null;
  progressXp: number;
  progressPercent: number;
};

type BalanceMap = Record<string, number>;

type Character = {
  _id?: string;
  memberId: string;
  characterName: string;
  avatarId?: string;
  world?: string;
  province?: string;
  region?: string;
  clan?: string;
  disciplines?: { name: string; level: number }[];
  mainProfession?: string;
  secondaryProfessions?: string[];
  combatRole?: "TANK" | "HEAL" | "DPS";
  specialization?: string;
  chronicleTitle?: string;
  chronicle?: string;
  isMainCharacter?: boolean;
};

type Achievement = {
  achievementId?: string;
  name?: string;
  description?: string;
  unlockedAt?: string;
  featuredOrder?: number;
};

type Quest = {
  questId?: string;
  title?: string;
  name?: string;
  status?: string;
  completedAt?: string;
  updatedAt?: string;
  createdAt?: string;
};

type ActivityItem = {
  id: string;
  icon: string;
  title: string;
  date?: string;
};

async function api<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({}));

  if (
    !response.ok ||
    payload?.success === false
  ) {
    throw new Error(
      payload?.message ||
        `Erreur serveur (${response.status}).`
    );
  }

  return payload;
}

function arr<T>(payload: any, key: string): T[] {
  if (Array.isArray(payload?.data?.[key])) {
    return payload.data[key];
  }

  if (Array.isArray(payload?.[key])) {
    return payload[key];
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  return [];
}

function roleLabel(role?: string) {
  const labels: Record<string, string> = {
    OWNER: "Rex",
    ADMIN: "Administrateur",
    ADMINISTRATOR: "Administrateur",
    MODERATOR: "Modérateur",
    PLAYER: "Membre",
    MEMBER: "Membre",
  };

  return (
    labels[String(role ?? "").toUpperCase()] ||
    role ||
    "Membre"
  );
}

function combatRoleLabel(role?: Character["combatRole"]) {
  const labels = {
    TANK: "Tank",
    HEAL: "Heal",
    DPS: "DPS",
  };

  return role ? labels[role] : "Non renseigné";
}

function combatRoleIcon(role?: Character["combatRole"]) {
  if (role === "TANK") return "🛡️";
  if (role === "HEAL") return "✚";
  return "⚔️";
}

function formatDate(value?: string) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-green-800 bg-green-950/60 p-4 text-center">
      <p className="text-2xl font-bold text-amber-400">
        {value.toLocaleString("fr-FR")}
      </p>
      <p className="mt-1 text-xs text-green-300">
        {label}
      </p>
    </div>
  );
}

function Balance({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-green-800 bg-green-950/60 p-4">
      <div className="text-xl">{icon}</div>
      <p className="mt-2 text-sm text-green-300">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold text-amber-400">
        {value.toLocaleString("fr-FR")}
      </p>
    </div>
  );
}

function TextStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-green-800 bg-green-950/60 p-4">
      <p className="text-xs uppercase tracking-wider text-green-400">
        {label}
      </p>
      <p className="mt-1 break-words font-semibold text-white">
        {value}
      </p>
    </div>
  );
}

function EmptyState({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-green-800 bg-green-950/40 p-6 text-center text-green-300">
      {children}
    </div>
  );
}

export default function PersonnagePage() {
  const [member, setMember] =
    useState<Member | null>(null);
  const [level, setLevel] =
    useState<Level | null>(null);
  const [balances, setBalances] =
    useState<BalanceMap>({});
  const [achievementStats, setAchievementStats] =
    useState({
      total: 0,
      unlocked: 0,
    });
  const [questStats, setQuestStats] =
    useState({
      active: 0,
      completed: 0,
    });
  const [featuredAchievements, setFeaturedAchievements] =
    useState<Achievement[]>([]);
  const [activities, setActivities] =
    useState<ActivityItem[]>([]);
  const [characters, setCharacters] =
    useState<Character[]>([]);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const current =
        (await getCurrentMember()) as Member | null;

      if (!current?.profile?.id) {
        throw new Error(
          "Impossible d'identifier le membre connecté."
        );
      }

      setMember(current);

      const id = encodeURIComponent(
        current.profile.id
      );

      const results =
        await Promise.allSettled([
          api<any>(
            `/paxdei/characters/member/${id}`
          ),
          api<any>(`/levels/user/${id}`),
          api<any>(`/economy/${id}`),
          Promise.all([
            api<any>("/achievements"),
            api<any>(`/achievements/user/${id}`),
            api<any>(
              `/achievements/user/${id}/featured`
            ),
          ]),
          Promise.all([
            api<any>("/quests"),
            api<any>(`/quests/user/${id}`),
          ]),
        ]);

      if (results[0].status === "fulfilled") {
        setCharacters(
          arr<Character>(
            results[0].value,
            "characters"
          )
        );
      } else {
        setCharacters([]);
      }

      if (results[1].status === "fulfilled") {
        setLevel(
          results[1].value?.data?.level ?? null
        );
      }

      if (results[2].status === "fulfilled") {
        setBalances(
          results[2].value?.data?.balances ?? {}
        );
      }

      if (results[3].status === "fulfilled") {
        const all = arr<Achievement>(
          results[3].value[0],
          "achievements"
        );

        const unlocked = arr<Achievement>(
          results[3].value[1],
          "achievements"
        );

        const featured = arr<Achievement>(
          results[3].value[2],
          "achievements"
        );

        setAchievementStats({
          total: all.filter(
            (item) => (item as any).enabled !== false
          ).length,
          unlocked: unlocked.length,
        });

        setFeaturedAchievements(featured);

        const achievementActivities: ActivityItem[] =
          unlocked
            .filter((item) => item.unlockedAt)
            .slice(0, 5)
            .map((item, index) => ({
              id: `achievement-${item.achievementId ?? index}`,
              icon: "⚔️",
              title: `Exploit obtenu : ${
                item.name ?? "Accomplissement"
              }`,
              date: item.unlockedAt,
            }));

        setActivities(achievementActivities);
      }

      if (results[4].status === "fulfilled") {
        const allQuests = arr<any>(
          results[4].value[0],
          "quests"
        ).filter(
          (item) => item.enabled !== false
        );

        const userQuests = arr<Quest>(
          results[4].value[1],
          "userQuests"
        );

        const active = userQuests.filter(
          (item) =>
            String(item.status ?? "").toLowerCase() ===
            "active"
        ).length;

        const completed = userQuests.filter(
          (item) =>
            String(item.status ?? "").toLowerCase() ===
            "completed"
        ).length;

        setQuestStats({
          active,
          completed,
        });

        const questMap = new Map(
          allQuests.map((quest) => [
            String(quest.questId),
            quest,
          ])
        );

        const questActivities: ActivityItem[] =
          userQuests
            .filter(
              (item) =>
                String(item.status ?? "").toLowerCase() ===
                "completed"
            )
            .map((item, index) => {
              const quest = questMap.get(
                String(item.questId)
              );

              return {
                id: `quest-${item.questId ?? index}`,
                icon: "📜",
                title: `Quête terminée : ${
                  quest?.title ??
                  quest?.name ??
                  String(item.questId ?? "Quête")
                }`,
                date:
                  item.completedAt ??
                  item.updatedAt ??
                  item.createdAt,
              };
            })
            .filter((item) => item.date)
            .slice(0, 5);

        setActivities((current) =>
          [...current, ...questActivities]
            .sort(
              (a, b) =>
                new Date(b.date ?? 0).getTime() -
                new Date(a.date ?? 0).getTime()
            )
            .slice(0, 5)
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger votre personnage."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const mainCharacter = useMemo(
    () =>
      characters.find(
        (character) => character.isMainCharacter
      ) ?? characters[0],
    [characters]
  );

  const disciplines = mainCharacter?.disciplines ?? [];

  const progress = Math.max(
    0,
    Math.min(
      100,
      level?.progressPercent ?? 0
    )
  );

  const memberName =
    member?.profile.displayName ||
    member?.profile.username ||
    "Membre";

  if (loading && !member) {
    return (
      <MemberPageBackground>
        <div className="mx-auto max-w-7xl px-6 py-12">
          Chargement de votre registre...
        </div>
      </MemberPageBackground>
    );
  }

  if (!member) {
    return (
      <MemberPageBackground>
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="rounded-2xl border border-red-700 bg-red-950/40 p-8">
          <h1 className="text-2xl font-bold text-red-300">
            Impossible de charger le personnage
          </h1>
          <p className="mt-2 text-red-200">
            {error || "Membre introuvable."}
          </p>
          <button
            onClick={load}
            className="mt-5 rounded-lg bg-amber-600 px-5 py-3 font-semibold hover:bg-amber-500"
          >
            Réessayer
          </button>
          </div>
        </div>
      </MemberPageBackground>
    );
  }

  const id = member.profile.id;

  return (
    <MemberPageBackground>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-400">
              Le Pacte du Chêne
            </p>
            <h1 className="mt-2 text-4xl font-bold">
              Registre du membre
            </h1>
            <p className="mt-3 max-w-2xl text-green-300">
              Votre identité au sein du Pacte, votre personnage
              Pax Dei et les traces de votre parcours.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/paxdei"
              className="rounded-lg border border-green-700 bg-green-950 px-5 py-3 text-sm font-semibold text-green-200 transition hover:border-amber-500 hover:text-amber-300"
            >
              Gérer mes personnages
            </Link>

            <button
              onClick={load}
              className="rounded-lg bg-amber-600 px-5 py-3 text-sm font-semibold hover:bg-amber-500"
            >
              Actualiser
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-amber-700 bg-amber-950/30 p-4 text-amber-200">
            Certaines informations n'ont pas pu être chargées.
            Vous pouvez actualiser la page pour réessayer.
          </div>
        )}

        <section className="relative mb-6 overflow-hidden rounded-2xl border border-amber-700/40 bg-gradient-to-br from-amber-950/30 via-green-900/70 to-green-950/60 p-6 shadow-xl">
          <img
            src="/images/member/arbre-pacte.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -right-8 -top-12 hidden h-72 w-72 object-contain opacity-[0.035] lg:block"
          />

          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center">
            <div className="relative flex w-32 shrink-0 flex-col items-center">
              <div className="relative z-10 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-amber-500/80 bg-green-950 text-5xl font-bold text-amber-400 shadow-lg shadow-black/30">
                {member.profile.avatar ? (
                  <img
                    src={member.profile.avatar}
                    alt={`Portrait de ${memberName}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  memberName.charAt(0).toUpperCase()
                )}
              </div>

              <img
                src="/images/member/blason-pacte.png"
                alt=""
                aria-hidden="true"
                className="relative z-20 -mt-2 h-11 w-11 object-contain drop-shadow-[0_3px_6px_rgba(0,0,0,0.4)]"
              />
            </div>

            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-400">
                Registre du Pacte
              </p>

              <h2 className="mt-1 text-3xl font-bold">
                {memberName}
              </h2>

              <p className="text-green-300">
                @{member.profile.username}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-amber-600/20 px-3 py-1 text-sm font-semibold text-amber-300">
                  {roleLabel(member.profile.role)}
                </span>

                {member.discord?.linked && (
                  <span className="rounded-full bg-indigo-900/50 px-3 py-1 text-sm text-indigo-200">
                    Discord lié
                  </span>
                )}

                {mainCharacter && (
                  <span className="rounded-full bg-green-950 px-3 py-1 text-sm text-green-300">
                    Pax Dei : {mainCharacter.characterName}
                  </span>
                )}
              </div>
            </div>

            <div className="w-full max-w-sm rounded-xl border border-green-800 bg-green-950/60 p-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-green-400">
                    Progression du Pacte
                  </p>
                  <p className="mt-1 text-2xl font-bold">
                    Niveau {level?.level ?? "—"}
                  </p>
                  <p className="text-sm text-amber-400">
                    {level?.levelName ??
                      "Niveau indisponible"}
                  </p>
                </div>

                <p className="text-xl font-bold text-amber-400">
                  {(level?.xp ?? 0).toLocaleString("fr-FR")} XP
                </p>
              </div>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-green-950">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="mt-2 flex justify-between text-xs text-green-300">
                <span>Vers le prochain niveau</span>
                <span>{Math.round(progress)} %</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-6 grid gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-green-800 bg-green-900/50 p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-amber-400">
                  Pax Dei
                </p>
                <h2 className="mt-1 text-2xl font-bold">
                  Personnage principal
                </h2>
              </div>

              <span className="rounded-full bg-green-950 px-3 py-1 text-xs font-semibold text-green-300">
                {characters.length} personnage
                {characters.length > 1 ? "s" : ""}
              </span>
            </div>

            {mainCharacter ? (
              <div className="mt-5 rounded-xl border border-amber-500/40 bg-green-950/50 p-5">
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
                      {combatRoleIcon(
                        mainCharacter.combatRole
                      )}{" "}
                      Personnage principal
                    </p>

                    <h3 className="mt-1 text-3xl font-bold">
                      {mainCharacter.characterName}
                    </h3>

                    <p className="mt-2 text-green-300">
                      {mainCharacter.world ||
                        "Monde non renseigné"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-green-800 bg-green-900/50 px-5 py-4 text-center">
                    <p className="text-xs uppercase tracking-wider text-green-400">
                      Rôle
                    </p>
                    <p className="mt-1 font-bold text-amber-400">
                      {combatRoleLabel(
                        mainCharacter.combatRole
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <TextStat
                    label="Province"
                    value={
                      mainCharacter.province || "Non renseignée"
                    }
                  />
                  <TextStat
                    label="Région"
                    value={
                      mainCharacter.region || "Non renseignée"
                    }
                  />
                  <TextStat
                    label="Clan"
                    value={
                      mainCharacter.clan || "Non renseigné"
                    }
                  />
                  <TextStat
                    label="Disciplines Pax Dei"
                    value={
                      mainCharacter.disciplines?.length
                        ? `${mainCharacter.disciplines.length} discipline${mainCharacter.disciplines.length > 1 ? "s" : ""}`
                        : "Aucune"
                    }
                  />
                </div>


                {mainCharacter.specialization && (
                  <div className="mt-4 rounded-xl border border-green-800 bg-green-900/40 p-4">
                    <p className="text-xs uppercase tracking-wider text-green-400">
                      Spécialisation
                    </p>
                    <p className="mt-1 font-semibold text-white">
                      {mainCharacter.specialization}
                    </p>
                  </div>
                )}

                <div className="mt-5">
                  <Link
                    href="/paxdei"
                    className="inline-flex rounded-lg border border-green-700 bg-green-900 px-4 py-2 text-sm font-semibold text-amber-400 transition hover:border-amber-500 hover:text-amber-300"
                  >
                    Modifier mes informations →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-5">
                <EmptyState>
                  <p>
                    Aucun personnage Pax Dei n'est encore
                    renseigné.
                  </p>

                  <Link
                    href="/paxdei"
                    className="mt-4 inline-block rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500"
                  >
                    Renseigner mon personnage →
                  </Link>
                </EmptyState>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-green-800 bg-green-900/50 p-6 shadow-xl">
            <p className="text-sm uppercase tracking-[0.2em] text-amber-400">
              Style de combat
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              Votre rôle
            </h2>

            <div className="mt-6 grid grid-cols-3 gap-2">
              {(["TANK", "HEAL", "DPS"] as const).map(
                (role) => {
                  const selected =
                    mainCharacter?.combatRole === role;

                  return (
                    <div
                      key={role}
                      className={`rounded-xl border p-3 text-center ${
                        selected
                          ? "border-amber-500 bg-amber-950/30"
                          : "border-green-800 bg-green-950/40"
                      }`}
                    >
                      <div className="text-xl">
                        {combatRoleIcon(role)}
                      </div>
                      <p
                        className={`mt-1 text-xs font-semibold ${
                          selected
                            ? "text-amber-300"
                            : "text-green-300"
                        }`}
                      >
                        {combatRoleLabel(role)}
                      </p>
                    </div>
                  );
                }
              )}
            </div>

            <p className="mt-5 text-sm text-green-300">
              Ce rôle est renseigné manuellement par le membre
              et sert principalement à faciliter la composition
              des groupes du Pacte.
            </p>
          </section>

          <section className="rounded-2xl border border-green-800 bg-green-900/50 p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-amber-400">
                  Disciplines Pax Dei
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  Vos disciplines
                </h2>
              </div>

              <span className="shrink-0 rounded-full bg-green-950 px-3 py-1 text-xs font-semibold text-green-300">
                {disciplines.length}
              </span>
            </div>

            {disciplines.length > 0 ? (
              <div className="mt-5">
                <p className="mb-3 text-xs text-green-400">
                  Faites défiler la liste avec la molette pour consulter vos disciplines.
                </p>

                <div
                  className="max-h-[320px] space-y-2 overflow-y-auto pr-2 overscroll-contain"
                  aria-label="Liste des disciplines Pax Dei"
                >
                  {disciplines.map((discipline) => {
                    const levelValue = Math.max(
                      0,
                      Math.min(
                        40,
                        Number(discipline.level) || 0
                      )
                    );
                    const percent = (levelValue / 40) * 100;

                    return (
                      <div
                        key={discipline.name}
                        className="rounded-xl border border-green-800 bg-green-950/50 p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="min-w-0 truncate font-semibold text-green-100">
                            {discipline.name}
                          </span>

                          <span className="shrink-0 font-bold text-amber-400">
                            {levelValue}/40
                          </span>
                        </div>

                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-green-950">
                          <div
                            className="h-full rounded-full bg-amber-500 transition-all"
                            style={{ width: `${percent}%` }}
                          />
                        </div>

                        <div className="mt-1 flex justify-between text-[11px] text-green-400">
                          <span>Progression</span>
                          <span>{Math.round(percent)} %</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="mt-3 text-xs text-green-400">
                  Niveau maximum : 40.
                </p>

                <Link
                  href="/paxdei"
                  className="mt-4 inline-flex rounded-lg border border-green-700 bg-green-900 px-4 py-2 text-sm font-semibold text-amber-400 transition hover:border-amber-500 hover:text-amber-300"
                >
                  Modifier mes disciplines →
                </Link>
              </div>
            ) : (
              <div className="mt-5">
                <EmptyState>
                  <p>Aucune discipline n'est encore renseignée.</p>

                  <Link
                    href="/paxdei"
                    className="mt-4 inline-block rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500"
                  >
                    Renseigner mes disciplines →
                  </Link>
                </EmptyState>
              </div>
            )}
          </section>
        </section>

        <section className="mb-6 rounded-2xl border border-green-800 bg-green-900/50 p-6 shadow-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-amber-400">
                Progression
              </p>
              <h2 className="mt-1 text-2xl font-bold">
                Votre parcours au sein du Pacte
              </h2>
              <p className="mt-2 text-green-300">
                Une progression indépendante de votre progression
                en jeu.
              </p>
            </div>

            <Link
              href="/niveaux"
              className="text-sm font-semibold text-amber-400 hover:text-amber-300"
            >
              Voir les niveaux →
            </Link>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Stat
              label="XP totale"
              value={level?.xp ?? 0}
            />
            <Stat
              label="Exploits obtenus"
              value={achievementStats.unlocked}
            />
            <Stat
              label="Quêtes terminées"
              value={questStats.completed}
            />
          </div>
        </section>

        <section className="mb-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-green-800 bg-green-900/50 p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-amber-400">
                  Hauts faits
                </p>
                <h2 className="mt-1 text-2xl font-bold">
                  Exploits mis en avant
                </h2>
              </div>

              <Link
                href="/espace-membre/exploits"
                className="text-sm font-semibold text-amber-400 hover:text-amber-300"
              >
                Tous mes exploits →
              </Link>
            </div>

            <div className="mt-5">
              {featuredAchievements.length === 0 ? (
                <EmptyState>
                  Vous n'avez pas encore choisi d'exploit à
                  mettre en avant.
                </EmptyState>
              ) : (
                <div className="space-y-3">
                  {featuredAchievements.map(
                    (achievement) => (
                      <div
                        key={
                          achievement.achievementId ??
                          achievement.name
                        }
                        className="rounded-xl border border-green-800 bg-green-950/50 p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-xl">
                            ⚔️
                          </div>
                          <div>
                            <p className="font-semibold text-white">
                              {achievement.name}
                            </p>
                            {achievement.description && (
                              <p className="mt-1 text-sm text-green-300">
                                {achievement.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-green-800 bg-green-900/50 p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-amber-400">
                  Économie
                </p>
                <h2 className="mt-1 text-2xl font-bold">
                  Votre patrimoine
                </h2>
              </div>

              <Link
                href={`/economie/${encodeURIComponent(id)}`}
                className="text-sm font-semibold text-amber-400 hover:text-amber-300"
              >
                Détail →
              </Link>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Balance
                icon="🪙"
                label="Solidus"
                value={balances.solidus ?? 0}
              />
              <Balance
                icon="⚪"
                label="Argent"
                value={balances.argent ?? 0}
              />
              <Balance
                icon="🟤"
                label="Bronze"
                value={balances.bronze ?? 0}
              />
            </div>

            <p className="mt-4 text-sm text-green-400">
              Les transactions détaillées restent disponibles
              sur la page Économie.
            </p>
          </section>
        </section>

        <section className="mb-6 rounded-2xl border border-green-800 bg-green-900/50 p-6 shadow-xl">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-amber-400">
              📜 Chronique
            </p>
            <h2 className="mt-1 text-2xl font-bold">
              L'histoire de votre personnage
            </h2>
          </div>

          {mainCharacter?.chronicle ? (
            <div className="mt-5 rounded-xl border border-amber-700/30 bg-green-950/50 p-6">
              <p className="text-lg font-semibold text-amber-300">
                {mainCharacter.chronicleTitle ||
                  `Les mémoires de ${mainCharacter.characterName}`}
              </p>

              <p className="mt-4 whitespace-pre-line leading-7 text-green-100">
                {mainCharacter.chronicle}
              </p>

              <Link
                href="/paxdei"
                className="mt-5 inline-block text-sm font-semibold text-amber-400 hover:text-amber-300"
              >
                Modifier ma chronique →
              </Link>
            </div>
          ) : (
            <div className="mt-5">
              <EmptyState>
                <p>
                  Votre personnage n'a pas encore de chronique.
                </p>

                <Link
                  href="/paxdei"
                  className="mt-4 inline-block rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500"
                >
                  Écrire ma chronique →
                </Link>
              </EmptyState>
            </div>
          )}
        </section>

        <section className="mb-6 rounded-2xl border border-green-800 bg-green-900/50 p-6 shadow-xl">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-amber-400">
                🕯 Activité récente
              </p>
              <h2 className="mt-1 text-2xl font-bold">
                Les dernières traces de votre parcours
              </h2>
            </div>
          </div>

          <div className="mt-5">
            {activities.length === 0 ? (
              <EmptyState>
                Votre activité apparaîtra ici au fil de vos
                quêtes et exploits.
              </EmptyState>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-4 rounded-xl border border-green-800 bg-green-950/50 p-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-900 text-lg">
                      {activity.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white">
                        {activity.title}
                      </p>

                      {activity.date && (
                        <p className="mt-1 text-xs text-green-400">
                          {formatDate(activity.date)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <Link
            href="/espace-membre/quetes"
            className="group rounded-2xl border border-green-800 bg-green-900/50 p-6 shadow-xl transition hover:border-amber-500/60"
          >
            <p className="text-sm uppercase tracking-[0.2em] text-amber-400">
              Quêtes
            </p>

            <h2 className="mt-1 text-2xl font-bold group-hover:text-amber-300">
              Votre aventure
            </h2>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <Stat
                label="En cours"
                value={questStats.active}
              />
              <Stat
                label="Terminées"
                value={questStats.completed}
              />
            </div>

            <span className="mt-5 block text-sm font-semibold text-amber-400">
              Voir mes quêtes →
            </span>
          </Link>

          <Link
            href="/clan"
            className="group rounded-2xl border border-green-800 bg-green-900/50 p-6 shadow-xl transition hover:border-amber-500/60"
          >
            <p className="text-sm uppercase tracking-[0.2em] text-amber-400">
              🌳 Clan
            </p>

            <h2 className="mt-1 text-2xl font-bold group-hover:text-amber-300">
              Votre place dans le Pacte
            </h2>

            <p className="mt-3 text-green-300">
              Retrouvez l'arbre du clan et votre position au sein
              de la communauté.
            </p>

            <span className="mt-5 block text-sm font-semibold text-amber-400">
              Voir l'arbre du clan →
            </span>
          </Link>
        </section>
      </div>
    </MemberPageBackground>
  );
}