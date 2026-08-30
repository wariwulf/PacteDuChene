"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import MemberPageBackground from "@/components/member/MemberPageBackground";
import { getCurrentMember } from "@/services/members.service";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const MAX_DISCIPLINE_LEVEL = 40;

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
    username?: string;
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
  history?: Array<{
    action?: string;
    source?: string;
    amount?: number;
    previousXp?: number;
    newXp?: number;
    previousLevel?: number;
    newLevel?: number;
    reason?: string;
    createdAt?: string;
  }>;
};

type Character = {
  _id?: string;
  memberId: string;
  characterName: string;
  avatarId?: string;
  world?: string;
  province?: string;
  region?: string;
  clan?: string;
  disciplines?: Array<{ name: string; level: number }>;
  mainProfession?: string;
  secondaryProfessions?: string[];
  combatRole?: "TANK" | "HEAL" | "DPS";
  specialization?: string;
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

type Event = {
  eventId: string;
  title: string;
  description?: string;
  type: string;
  startsAt: string;
  endsAt?: string;
  location?: string;
  status?: string;
};

type EventWithParticipation = {
  event: Event;
  participation: "ACCEPTED" | "MAYBE" | "DECLINED" | null;
  counts: { ACCEPTED: number; MAYBE: number; DECLINED: number };
};

type Activity = {
  id: string;
  icon: string;
  title: string;
  date?: string;
};

type Balances = {
  solidus: number;
  argent: number;
  bronze: number;
};

async function api<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload?.success === false) {
    throw new Error(
      payload?.message || `Erreur serveur (${response.status}).`
    );
  }

  return payload;
}

function arrayFrom<T>(payload: any, key: string): T[] {
  if (Array.isArray(payload?.data?.[key])) return payload.data[key];
  if (Array.isArray(payload?.[key])) return payload[key];
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
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

  return labels[String(role ?? "").toUpperCase()] || role || "Membre";
}

function combatRoleLabel(role?: Character["combatRole"]) {
  if (role === "TANK") return "Tank";
  if (role === "HEAL") return "Heal";
  if (role === "DPS") return "DPS";
  return "Non renseigné";
}

function combatRoleIcon(role?: Character["combatRole"]) {
  if (role === "TANK") return "🛡️";
  if (role === "HEAL") return "✚";
  if (role === "DPS") return "⚔️";
  return "✦";
}

function formatDate(value?: string, withTime = false) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

function formatRelativeDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  if (hours < 24) return `Il y a ${hours} h`;
  if (days < 7) return `Il y a ${days} j`;
  return formatDate(value);
}

function SectionTitle({
  eyebrow,
  title,
  href,
  linkLabel = "Voir tout →",
}: {
  eyebrow: string;
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-amber-400">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-2xl font-bold text-white">{title}</h2>
      </div>
      {href && (
        <Link
          href={href}
          className="shrink-0 text-sm font-semibold text-green-200 transition hover:text-amber-300"
        >
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-green-700/80 bg-green-950/60 p-6 shadow-xl backdrop-blur-[2px] ${className}`}
    >
      {children}
    </section>
  );
}

function StatCard({
  label,
  value,
  detail,
  href,
}: {
  label: string;
  value: string;
  detail: string;
  href?: string;
}) {
  const content = (
    <div className="rounded-xl border border-green-700/80 bg-green-950/65 p-5 transition hover:border-amber-500/40">
      <p className="text-xs uppercase tracking-[0.18em] text-green-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-amber-400">{value}</p>
      <p className="mt-1 text-sm text-green-300">{detail}</p>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

export default function EspaceMembrePage() {
  const [member, setMember] = useState<Member | null>(null);
  const [level, setLevel] = useState<Level | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [events, setEvents] = useState<EventWithParticipation[]>([]);
  const [balances, setBalances] = useState<Balances>({
    solidus: 0,
    argent: 0,
    bronze: 0,
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const current = (await getCurrentMember()) as Member | null;
      if (!current?.profile?.id) {
        throw new Error("Impossible d'identifier le membre connecté.");
      }

      setMember(current);
      const id = encodeURIComponent(current.profile.id);

      const results = await Promise.allSettled([
        api<any>(`/levels/user/${id}`),
        api<any>(`/paxdei/characters/member/${id}`),
        Promise.all([
          api<any>("/achievements"),
          api<any>(`/achievements/user/${id}`),
          api<any>(`/achievements/user/${id}/featured`),
        ]),
        Promise.all([
          api<any>("/quests"),
          api<any>(`/quests/user/${id}`),
        ]),
        api<any>(`/economy/${id}`),
        api<any>("/clan-events/upcoming"),
      ]);

      if (results[0].status === "fulfilled") {
        setLevel(results[0].value?.data?.level ?? null);
      }

      if (results[1].status === "fulfilled") {
        setCharacters(arrayFrom<Character>(results[1].value, "characters"));
      }

      let nextActivities: Activity[] = [];

      if (results[2].status === "fulfilled") {
        const all = arrayFrom<Achievement>(results[2].value[0], "achievements");
        const unlocked = arrayFrom<Achievement>(results[2].value[1], "achievements");
        const featured = arrayFrom<Achievement>(results[2].value[2], "achievements");

        setAllAchievements(all);
        setAchievements(featured.length ? featured : unlocked);

        nextActivities = unlocked
          .filter((item) => item.unlockedAt)
          .map((item, index) => ({
            id: `achievement-${item.achievementId ?? index}`,
            icon: "🏆",
            title: `Exploit obtenu : ${item.name ?? "Accomplissement"}`,
            date: item.unlockedAt,
          }));
      }

      if (results[3].status === "fulfilled") {
        const allQuests = arrayFrom<Quest>(results[3].value[0], "quests");
        const userQuests = arrayFrom<Quest>(results[3].value[1], "quests");
        setQuests(userQuests);

        const questMap = new Map(
          allQuests.map((quest) => [String(quest.questId), quest])
        );

        const questActivities = userQuests
          .filter((quest) => String(quest.status).toLowerCase() === "completed")
          .map((quest, index) => {
            const definition = questMap.get(String(quest.questId));
            return {
              id: `quest-${quest.questId ?? index}`,
              icon: "📜",
              title: `Quête terminée : ${definition?.name ?? definition?.title ?? quest.questId ?? "Quête"}`,
              date: quest.completedAt ?? quest.updatedAt ?? quest.createdAt,
            };
          });

        nextActivities = [...nextActivities, ...questActivities];
      }

      if (results[4].status === "fulfilled") {
        const raw = results[4].value?.data?.balances ?? {};
        setBalances({
          solidus: Number(raw.solidus ?? 0),
          argent: Number(raw.argent ?? 0),
          bronze: Number(raw.bronze ?? 0),
        });
      }

      if (results[5].status === "fulfilled") {
        setEvents(arrayFrom<EventWithParticipation>(results[5].value, "events"));
      }

      if (level?.history) {
        nextActivities = [
          ...nextActivities,
          ...level.history.map((item, index) => ({
            id: `level-${index}-${item.createdAt ?? ""}`,
            icon: "✦",
            title:
              item.reason ||
              (item.amount
                ? `${item.amount > 0 ? "+" : ""}${item.amount} XP`
                : "Progression du Pacte"),
            date: item.createdAt,
          })),
        ];
      }

      setActivities(
        nextActivities
          .filter((item) => item.date)
          .sort(
            (a, b) =>
              new Date(b.date ?? 0).getTime() -
              new Date(a.date ?? 0).getTime()
          )
          .slice(0, 5)
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger votre espace membre."
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
      characters.find((character) => character.isMainCharacter) ??
      characters[0],
    [characters]
  );

  const disciplines = mainCharacter?.disciplines ?? [];
  const activeQuests = quests.filter(
    (quest) => String(quest.status).toLowerCase() === "active"
  );
  const completedQuests = quests.filter(
    (quest) => String(quest.status).toLowerCase() === "completed"
  );

  const levelProgress = Math.max(
    0,
    Math.min(100, Number(level?.progressPercent ?? 0))
  );

  const nextLevelRemaining =
    level?.nextLevelXp == null
      ? null
      : Math.max(0, level.nextLevelXp - (level.xp ?? 0));

  const memberName =
    member?.profile.displayName || member?.profile.username || "Membre";

  if (loading && !member) {
    return (
      <MemberPageBackground>
        <div className="mx-auto max-w-7xl px-6 py-16 text-green-200">
          Chargement de votre domaine...
        </div>
      </MemberPageBackground>
    );
  }

  if (!member) {
    return (
      <MemberPageBackground>
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="rounded-2xl border border-red-700 bg-red-950/50 p-8">
            <h1 className="text-2xl font-bold text-red-200">
              Impossible de charger votre domaine
            </h1>
            <p className="mt-2 text-red-300">
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

  return (
    <MemberPageBackground>
      <div className="mx-auto max-w-7xl px-5 py-8 md:px-6 md:py-10">
        {/* En-tête */}
        <header className="mb-7 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-400">
              Le Pacte du Chêne
            </p>
            <h1 className="mt-2 text-4xl font-bold text-white md:text-5xl">
              Bienvenue, {memberName}
            </h1>
            <p className="mt-3 max-w-2xl text-green-300">
              Retrouvez ici l'essentiel de votre parcours au sein du Pacte.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/espace-membre/personnage"
              className="rounded-lg border border-green-700 bg-green-950/70 px-5 py-3 text-sm font-semibold text-green-100 transition hover:border-amber-500 hover:text-amber-300"
            >
              Mon registre →
            </Link>
            <button
              onClick={load}
              disabled={loading}
              className="rounded-lg bg-amber-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-500 disabled:opacity-50"
            >
              {loading ? "Actualisation..." : "Actualiser"}
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-amber-700/70 bg-amber-950/40 p-4 text-sm text-amber-200">
            Certaines informations n'ont pas pu être chargées. Vous pouvez
            actualiser la page pour réessayer.
          </div>
        )}

        {/* Identité + progression */}
        <section className="relative mb-6 overflow-hidden rounded-2xl border border-amber-700/40 bg-green-950/55 p-6 shadow-2xl backdrop-blur-[2px] md:p-7">
          <img
            src="/images/member/arbre-pacte.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-20 hidden h-80 w-80 opacity-[0.035] lg:block"
          />

          <div className="relative z-10 grid gap-7 lg:grid-cols-[300px_1fr] lg:items-center">
            <div className="flex items-center gap-5">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-amber-500 bg-green-950 text-4xl font-bold text-amber-400 shadow-lg">
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

              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-400">
                  Registre du Pacte
                </p>
                <h2 className="mt-1 truncate text-2xl font-bold">
                  {memberName}
                </h2>
                <p className="text-sm text-green-300">
                  @{member.profile.username}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-amber-600/20 px-3 py-1 text-xs font-bold text-amber-300">
                    {roleLabel(member.profile.role)}
                  </span>
                  {member.discord?.linked && (
                    <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-200">
                      Discord lié
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-green-700 bg-green-950/65 p-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-green-400">
                    Progression du Pacte
                  </p>
                  <h2 className="mt-1 text-2xl font-bold">
                    Niveau {level?.level ?? "—"}
                  </h2>
                  <p className="text-sm text-amber-300">
                    {level?.levelName || "Progression du membre"}
                  </p>
                </div>
                <p className="text-2xl font-bold text-amber-400">
                  {(level?.xp ?? 0).toLocaleString("fr-FR")} XP
                </p>
              </div>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-green-950">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>

              <div className="mt-2 flex justify-between gap-3 text-xs text-green-300">
                <span>
                  {level?.progressXp ?? 0} XP dans ce niveau
                </span>
                <span>{Math.round(levelProgress)} %</span>
              </div>

              <p className="mt-3 text-xs text-green-400">
                {nextLevelRemaining === null
                  ? "Vous avez atteint le dernier niveau défini."
                  : `${nextLevelRemaining.toLocaleString("fr-FR")} XP avant le niveau suivant.`}
              </p>
            </div>
          </div>
        </section>

        {/* Chiffres clés */}
        <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Personnage principal"
            value={mainCharacter?.characterName || "—"}
            detail={mainCharacter ? mainCharacter.world || "Pax Dei" : "Aucun personnage renseigné"}
            href="/espace-membre/personnage"
          />
          <StatCard
            label="Disciplines"
            value={String(disciplines.length)}
            detail="Niveaux renseignés sur 40"
            href="/paxdei"
          />
          <StatCard
            label="Quêtes"
            value={String(activeQuests.length)}
            detail={`${completedQuests.length} terminée${completedQuests.length > 1 ? "s" : ""}`}
            href="/espace-membre/quetes"
          />
          <StatCard
            label="Exploits"
            value={String(achievements.length)}
            detail={`sur ${allAchievements.length || "—"} disponibles`}
            href="/espace-membre/exploits"
          />
        </section>

        {/* Personnage / événements */}
        <section className="mb-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Panel>
            <SectionTitle
              eyebrow="Pax Dei"
              title="Votre personnage"
              href="/espace-membre/personnage"
              linkLabel="Voir mon registre →"
            />

            {mainCharacter ? (
              <div className="rounded-xl border border-green-700 bg-green-950/55 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-green-400">
                      Personnage principal
                    </p>
                    <h3 className="mt-1 text-2xl font-bold">
                      {mainCharacter.characterName}
                    </h3>
                    <p className="mt-1 text-green-300">
                      {mainCharacter.world || "Monde non renseigné"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-green-700 bg-green-900/50 px-4 py-3 text-center">
                    <div className="text-xl">{combatRoleIcon(mainCharacter.combatRole)}</div>
                    <p className="mt-1 text-xs font-semibold text-green-300">
                      {combatRoleLabel(mainCharacter.combatRole)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-green-800 bg-green-950/60 p-3">
                    <p className="text-xs uppercase text-green-500">Province</p>
                    <p className="mt-1 font-semibold">{mainCharacter.province || "Non renseignée"}</p>
                  </div>
                  <div className="rounded-lg border border-green-800 bg-green-950/60 p-3">
                    <p className="text-xs uppercase text-green-500">Région</p>
                    <p className="mt-1 font-semibold">{mainCharacter.region || "Non renseignée"}</p>
                  </div>
                  <div className="rounded-lg border border-green-800 bg-green-950/60 p-3">
                    <p className="text-xs uppercase text-green-500">Clan</p>
                    <p className="mt-1 font-semibold">{mainCharacter.clan || "Non renseigné"}</p>
                  </div>
                  <div className="rounded-lg border border-green-800 bg-green-950/60 p-3">
                    <p className="text-xs uppercase text-green-500">Spécialisation</p>
                    <p className="mt-1 font-semibold">{mainCharacter.specialization || "Non renseignée"}</p>
                  </div>
                </div>

                {disciplines.length > 0 && (
                  <div className="mt-4 rounded-lg border border-green-800 bg-green-950/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-400">
                        Disciplines principales
                      </p>
                      <span className="text-xs font-semibold text-amber-400">
                        {disciplines.length} renseignée{disciplines.length > 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {disciplines.slice(0, 5).map((discipline) => {
                        const levelValue = Math.max(
                          0,
                          Math.min(MAX_DISCIPLINE_LEVEL, Number(discipline.level) || 0)
                        );
                        return (
                          <span
                            key={discipline.name}
                            className="rounded-lg border border-green-700 bg-green-900/60 px-3 py-2 text-sm text-green-100"
                          >
                            {discipline.name} <strong className="ml-1 text-amber-400">{levelValue}</strong>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-green-700 bg-green-950/40 p-8 text-center">
                <div className="text-4xl">🌳</div>
                <h3 className="mt-3 text-lg font-bold">Votre personnage n'est pas encore renseigné</h3>
                <p className="mt-2 text-sm text-green-300">
                  Ajoutez votre personnage Pax Dei et vos disciplines pour enrichir votre registre.
                </p>
                <Link
                  href="/paxdei"
                  className="mt-5 inline-block rounded-lg bg-amber-600 px-5 py-3 text-sm font-semibold hover:bg-amber-500"
                >
                  Renseigner mon personnage →
                </Link>
              </div>
            )}
          </Panel>

          <Panel>
            <SectionTitle
              eyebrow="Vie du Pacte"
              title="Prochains événements"
              href="/espace-membre/evenements"
              linkLabel="Voir le calendrier →"
            />

            {events.length > 0 ? (
              <div className="space-y-3">
                {events.slice(0, 3).map(({ event, participation }) => (
                  <Link
                    key={event.eventId}
                    href="/espace-membre/evenements"
                    className="block rounded-xl border border-green-700 bg-green-950/55 p-4 transition hover:border-amber-500/50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-[0.15em] text-amber-400">
                          {event.type}
                        </p>
                        <h3 className="mt-1 truncate font-bold text-white">{event.title}</h3>
                        <p className="mt-1 text-sm text-green-300">
                          {formatDate(event.startsAt, true)}
                          {event.location ? ` · ${event.location}` : ""}
                        </p>
                      </div>
                      {participation && (
                        <span className="shrink-0 rounded-full bg-green-800/70 px-2.5 py-1 text-[11px] font-semibold text-green-200">
                          {participation === "ACCEPTED"
                            ? "Présent"
                            : participation === "MAYBE"
                              ? "Peut-être"
                              : "Absent"}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-green-700 bg-green-950/40 p-8 text-center">
                <div className="text-4xl">📜</div>
                <h3 className="mt-3 font-bold">Aucun événement à venir</h3>
                <p className="mt-2 text-sm text-green-300">
                  Le calendrier du Pacte est actuellement calme.
                </p>
              </div>
            )}
          </Panel>
        </section>

        {/* Disciplines */}
        <Panel className="mb-6">
          <SectionTitle
            eyebrow="Disciplines Pax Dei"
            title="Votre savoir-faire"
            href="/paxdei"
            linkLabel="Gérer mes disciplines →"
          />

          {disciplines.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {disciplines.slice(0, 6).map((discipline) => {
                const levelValue = Math.max(
                  0,
                  Math.min(MAX_DISCIPLINE_LEVEL, Number(discipline.level) || 0)
                );
                const percent = (levelValue / MAX_DISCIPLINE_LEVEL) * 100;

                return (
                  <div
                    key={discipline.name}
                    className="rounded-xl border border-green-700 bg-green-950/55 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-green-100">{discipline.name}</span>
                      <span className="font-bold text-amber-400">
                        {levelValue}/{MAX_DISCIPLINE_LEVEL}
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-green-950">
                      <div
                        className="h-full rounded-full bg-amber-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-green-400">
                      Progression · {Math.round(percent)} %
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-green-700 bg-green-950/40 p-7 text-center text-green-300">
              Aucune discipline n'est encore renseignée.
            </div>
          )}

          {disciplines.length > 6 && (
            <p className="mt-4 text-center text-sm text-green-400">
              + {disciplines.length - 6} autre{disciplines.length - 6 > 1 ? "s" : ""} discipline{disciplines.length - 6 > 1 ? "s" : ""}
            </p>
          )}
        </Panel>

        {/* Activité / économie */}
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Panel>
            <SectionTitle
              eyebrow="Chronique du membre"
              title="Votre activité récente"
            />

            {activities.length > 0 ? (
              <div className="divide-y divide-green-800/80">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-green-700 bg-green-900/60 text-lg">
                      {activity.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-green-100">{activity.title}</p>
                      <p className="mt-1 text-xs text-green-500">
                        {formatRelativeDate(activity.date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-green-700 bg-green-950/40 p-7 text-center text-green-300">
                Votre historique apparaîtra ici au fil de votre progression.
              </div>
            )}
          </Panel>

          <Panel>
            <SectionTitle
              eyebrow="Économie"
              title="Votre patrimoine"
              href="/espace-membre/economie"
              linkLabel="Voir l'économie →"
            />

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-xl border border-amber-500/20 bg-green-950/65 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-green-400">Solidus</p>
                <p className="mt-1 text-2xl font-bold text-amber-400">
                  {balances.solidus.toLocaleString("fr-FR")}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-green-950/65 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-green-400">Argent</p>
                <p className="mt-1 text-2xl font-bold text-gray-100">
                  {balances.argent.toLocaleString("fr-FR")}
                </p>
              </div>
              <div className="rounded-xl border border-orange-700/30 bg-green-950/65 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-green-400">Bronze</p>
                <p className="mt-1 text-2xl font-bold text-orange-400">
                  {balances.bronze.toLocaleString("fr-FR")}
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs text-green-500">
              Les transactions détaillées restent disponibles dans votre page Économie.
            </p>
          </Panel>
        </section>

        {/* Accès rapides */}
        <section className="mt-6">
          <Panel>
            <SectionTitle eyebrow="Le domaine" title="Accès rapides" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Link href="/espace-membre/quetes" className="rounded-xl border border-green-700 bg-green-950/55 p-4 transition hover:border-amber-500/50">
                <span className="text-2xl">📜</span>
                <h3 className="mt-2 font-bold">Quêtes</h3>
                <p className="mt-1 text-xs text-green-400">Suivre vos aventures.</p>
              </Link>
              <Link href="/espace-membre/exploits" className="rounded-xl border border-green-700 bg-green-950/55 p-4 transition hover:border-amber-500/50">
                <span className="text-2xl">🏆</span>
                <h3 className="mt-2 font-bold">Exploits</h3>
                <p className="mt-1 text-xs text-green-400">Voir vos accomplissements.</p>
              </Link>
              <Link href="/espace-membre/evenements" className="rounded-xl border border-green-700 bg-green-950/55 p-4 transition hover:border-amber-500/50">
                <span className="text-2xl">⚔️</span>
                <h3 className="mt-2 font-bold">Événements</h3>
                <p className="mt-1 text-xs text-green-400">Retrouver le Pacte.</p>
              </Link>
              <Link href="/discord" className="rounded-xl border border-green-700 bg-green-950/55 p-4 transition hover:border-amber-500/50">
                <span className="text-2xl">💬</span>
                <h3 className="mt-2 font-bold">Discord</h3>
                <p className="mt-1 text-xs text-green-400">Rejoindre la communauté.</p>
              </Link>
            </div>
          </Panel>
        </section>
      </div>
    </MemberPageBackground>
  );
}
