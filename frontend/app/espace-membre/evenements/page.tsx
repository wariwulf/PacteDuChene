"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getUpcomingClanEvents,
  setClanEventParticipation,
  removeClanEventParticipation,
  clanEventMediaUrl,
  type ClanEventWithParticipation,
  type ParticipationStatus,
} from "@/services/clan-events.service";

const typeLabels: Record<string, string> = {
  COLLECTE: "Collecte",
  COMBAT: "Combat",
  CEREMONIE: "Cérémonie",
  REUNION: "Réunion",
  SORTIE: "Sortie",
  AUTRE: "Événement",
};

const responseLabels: Record<ParticipationStatus, string> = {
  ACCEPTED: "Je participe",
  MAYBE: "Peut-être",
  DECLINED: "Je ne participe pas",
};

const DISCORD_EVENT_CHANNELS = {
  PACTE: "1487527127321677904",
  DOMAINE: "1541770841295953980",
  CONFRERIE: "1541771158079283260",
  GUILDE: "1541774120419856424",
} as const;

type EventGroupId = keyof typeof DISCORD_EVENT_CHANNELS | "OTHER";

const GROUPS: Array<{
  id: EventGroupId;
  name: string;
  shortName: string;
  icon: string;
  description: string;
}> = [
  {
    id: "PACTE",
    name: "Événements du Pacte",
    shortName: "Le Pacte",
    icon: "🌳",
    description: "Les rendez-vous qui concernent l'ensemble du clan.",
  },
  {
    id: "DOMAINE",
    name: "Domaine du Chêne",
    shortName: "Domaine",
    icon: "🌿",
    description: "Récolte, ressources, construction et approvisionnement.",
  },
  {
    id: "CONFRERIE",
    name: "Confrérie de l'Épée",
    shortName: "Confrérie",
    icon: "⚔️",
    description: "Combats, expéditions, chasse et récupération.",
  },
  {
    id: "GUILDE",
    name: "Guilde des Artisans",
    shortName: "Guilde",
    icon: "⚒️",
    description: "Fabrication, artisanat et activités de production.",
  },
];

function formatDate(v: string) {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "Date inconnue";
  return d.toLocaleString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function remaining(v?: string) {
  if (!v) return "";
  const ms = new Date(v).getTime() - Date.now();
  if (ms <= 0) return "En cours";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor(ms / 60000) % 60;
  return h ? `Dans ${h} h${m ? ` ${m}` : ""}` : `Dans ${m} min`;
}

function durationLabel(minutes?: number) {
  if (!minutes) return "—";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours && mins) return `${hours} h ${mins} min`;
  if (hours) return `${hours} h`;
  return `${mins} min`;
}

function channelForEvent(event: ClanEventWithParticipation["event"]): EventGroupId {
  const channel = String(event.discordChannelId ?? event.discordChannel ?? "");
  if (channel === DISCORD_EVENT_CHANNELS.PACTE) return "PACTE";
  if (channel === DISCORD_EVENT_CHANNELS.DOMAINE) return "DOMAINE";
  if (channel === DISCORD_EVENT_CHANNELS.CONFRERIE) return "CONFRERIE";
  if (channel === DISCORD_EVENT_CHANNELS.GUILDE) return "GUILDE";
  return "OTHER";
}

export default function EvenementsPage() {
  const [events, setEvents] = useState<ClanEventWithParticipation[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<EventGroupId | "ALL">("ALL");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setEvents(await getUpcomingClanEvents());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de charger les événements.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function respond(id: string, status: ParticipationStatus) {
    try {
      setBusy(id);
      setError("");
      await setClanEventParticipation(id, status);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible d'enregistrer votre réponse.");
    } finally {
      setBusy(null);
    }
  }

  async function clear(id: string) {
    try {
      setBusy(id);
      setError("");
      await removeClanEventParticipation(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de retirer votre réponse.");
    } finally {
      setBusy(null);
    }
  }

  const grouped = useMemo(() => {
    const result: Record<EventGroupId, ClanEventWithParticipation[]> = {
      PACTE: [],
      DOMAINE: [],
      CONFRERIE: [],
      GUILDE: [],
      OTHER: [],
    };
    for (const item of events) result[channelForEvent(item.event)].push(item);
    return result;
  }, [events]);

  const visibleGroups = useMemo(
    () =>
      filter === "ALL"
        ? GROUPS
        : GROUPS.filter((group) => group.id === filter),
    [filter],
  );

  const renderEvent = (item: ClanEventWithParticipation, featured = false) => {
    const { event, participation, counts } = item;
    const disabled = busy === event.eventId;

    return (
      <article
        id={`event-${event.eventId}`}
        key={event.eventId}
        className={`overflow-hidden rounded-2xl border bg-[#092317]/95 shadow-2xl transition hover:border-amber-700/60 ${
          featured
            ? "border-amber-700/70"
            : "border-green-800"
        }`}
      >
        {event.imageUrl && (
          <div className={`relative flex w-full items-center justify-center overflow-hidden border-b border-green-900 bg-[#020806] ${featured ? "min-h-[260px] sm:min-h-[340px]" : "min-h-[190px] sm:min-h-[230px]"}`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(21,65,42,.38),rgba(2,8,6,.98)_72%)]" />
            <img
              src={clanEventMediaUrl(event.imageUrl)}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover opacity-10 blur-3xl"
            />
            <img
              src={clanEventMediaUrl(event.imageUrl)}
              alt=""
              className={`relative z-10 max-w-[92%] object-contain drop-shadow-[0_18px_35px_rgba(0,0,0,.65)] ${featured ? "max-h-[300px]" : "max-h-[220px]"}`}
            />
          </div>
        )}

        <div className={`border-b border-green-800 p-5 ${featured ? "bg-[#0d2c1b] sm:p-6" : "bg-[#0b2618]"}`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-amber-600/20 px-3 py-1 text-xs font-bold uppercase text-amber-300">
                  {typeLabels[event.type] ?? "Événement"}
                </span>
                <span className="rounded-full border border-green-700 px-3 py-1 text-xs uppercase text-green-300">
                  {event.mode === "LONG" ? "Mission longue" : "Action"}
                </span>
                {event.recurrence?.enabled && (
                  <span className="rounded-full border border-amber-700/60 px-3 py-1 text-xs text-amber-300">
                    Récurrent
                  </span>
                )}
              </div>
              <h2 className={`mt-3 font-bold text-white ${featured ? "text-2xl" : "text-xl"}`}>
                {event.title}
              </h2>
            </div>
            {participation && (
              <span className="rounded-full border border-green-600 bg-green-950 px-4 py-2 text-sm text-green-200">
                {responseLabels[participation]}
              </span>
            )}
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-green-800 bg-[#061a10] p-4">
              <p className="text-xs font-bold uppercase text-amber-400">Début</p>
              <p className="mt-2 font-semibold capitalize text-green-100">{formatDate(event.startsAt)}</p>
              <p className="mt-1 text-sm text-amber-300">{remaining(event.startsAt)}</p>
            </div>
            <div className="rounded-xl border border-green-800 bg-[#061a10] p-4">
              <p className="text-xs font-bold uppercase text-amber-400">Durée</p>
              <p className="mt-2 font-semibold text-green-100">{durationLabel(event.durationMinutes)}</p>
            </div>
            {event.location && (
              <div className="rounded-xl border border-green-800 bg-[#061a10] p-4">
                <p className="text-xs font-bold uppercase text-amber-400">Lieu</p>
                <p className="mt-2 font-semibold text-green-100">{event.location}</p>
              </div>
            )}
          </div>

          {event.description && (
            <p className="mt-5 whitespace-pre-line leading-7 text-green-100/90">
              {event.description}
            </p>
          )}

          {!!event.objectives?.length && (
            <section className="mt-6">
              <h3 className="text-lg font-bold text-amber-300">Objectifs</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {event.objectives.map((objective) => (
                  <div key={objective.objectiveId} className="rounded-xl border border-green-800 bg-[#061a10] p-4">
                    <p className="font-semibold text-green-50">
                      {objective.required ? "◆" : "◇"} {objective.title}
                    </p>
                    {objective.description && (
                      <p className="mt-1 text-sm text-green-300">{objective.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {!!event.rewards?.length && (
            <section className="mt-6">
              <h3 className="text-lg font-bold text-amber-300">Récompenses</h3>
              <div className="mt-3 flex flex-wrap gap-3">
                {event.rewards.map((reward) => (
                  <span key={reward.rewardId} className="rounded-lg border border-amber-800/70 bg-amber-950/30 px-4 py-2 text-sm text-amber-200">
                    {reward.amount} {reward.currencyId}{reward.label ? ` · ${reward.label}` : ""}
                  </span>
                ))}
              </div>
            </section>
          )}

          <div className="mt-6 border-t border-green-800 pt-5">
            <div className="flex flex-wrap gap-3">
              {(["ACCEPTED", "MAYBE", "DECLINED"] as ParticipationStatus[]).map((status) => {
                const optionKey = status === "ACCEPTED" ? "accepted" : status === "MAYBE" ? "maybe" : "declined";
                const unavailable = event.participationOptions?.[optionKey] === false;
                return (
                  <button
                    key={status}
                    type="button"
                    disabled={disabled || unavailable}
                    onClick={() => void respond(event.eventId, status)}
                    className={`rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${
                      participation === status
                        ? "border-amber-400 bg-amber-600 text-white"
                        : "border-green-700 bg-green-950 text-green-200 hover:border-amber-500"
                    } disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    {responseLabels[status]}
                  </button>
                );
              })}
              {participation && (
                <button
                  type="button"
                  onClick={() => void clear(event.eventId)}
                  disabled={disabled}
                  className="px-3 py-2 text-sm text-green-400 transition hover:text-white disabled:opacity-40"
                >
                  Effacer ma réponse
                </button>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-5 text-sm text-green-300">
              <span><strong className="text-green-100">{counts.ACCEPTED}</strong> participants</span>
              <span><strong className="text-amber-100">{counts.MAYBE}</strong> peut-être</span>
              <span><strong className="text-red-100">{counts.DECLINED}</strong> absents</span>
            </div>
          </div>
        </div>
      </article>
    );
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#06120b] text-white">
      {/*
       * Background d'ambiance : l'image reste fixe pendant le défilement.
       * Elle est volontairement discrète afin de ne pas gêner la lecture des cartes.
       */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-[0.20]"
        style={{ backgroundImage: "url('/images/events/pacte-events-bg.webp')" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_50%_18%,rgba(15,58,36,.34),rgba(3,12,8,.94)_72%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-black/25"
      />

      <div className="relative z-10 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[.3em] text-amber-400">Le Pacte du Chêne</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold">Événements</h1>
              <p className="mt-2 max-w-2xl text-green-300">
                Retrouvez les rendez-vous du Pacte et de ses trois factions au même endroit.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="rounded-lg border border-amber-700 bg-amber-600 px-5 py-3 font-semibold transition hover:bg-amber-500 disabled:opacity-50"
            >
              {loading ? "Chargement…" : "Actualiser"}
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-800 bg-red-950/60 p-4 text-red-200">{error}</div>
        )}

        {!loading && events.length > 0 && (
          <nav className="mb-8 rounded-2xl border border-green-800 bg-[#092317]/90 p-3 shadow-xl" aria-label="Filtrer les événements">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFilter("ALL")}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${filter === "ALL" ? "bg-amber-600 text-white" : "text-green-200 hover:bg-white/5"}`}
              >
                Tous <span className="ml-1 text-xs opacity-70">{events.length}</span>
              </button>
              {GROUPS.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setFilter(group.id)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${filter === group.id ? "bg-amber-600 text-white" : "text-green-200 hover:bg-white/5"}`}
                >
                  <span className="mr-1">{group.icon}</span>{group.shortName}
                  <span className="ml-1 text-xs opacity-70">{grouped[group.id].length}</span>
                </button>
              ))}
            </div>
          </nav>
        )}

        {!loading && !events.length && (
          <section className="rounded-2xl border border-green-800 bg-[#0b2818]/95 p-14 text-center shadow-2xl">
            <div className="text-5xl">🌳</div>
            <h2 className="mt-4 text-2xl font-bold">Aucun événement à venir</h2>
            <p className="mt-2 text-green-300">Le calendrier du Pacte est actuellement calme.</p>
          </section>
        )}

        {!loading && events.length > 0 && (
          <div className="space-y-10">
            {visibleGroups.map((group) => {
              const items = grouped[group.id];
              if (!items.length) return null;
              const isPacte = group.id === "PACTE";

              return (
                <section key={group.id}>
                  <div className={`mb-5 rounded-2xl border p-5 ${isPacte ? "border-amber-700/70 bg-[#0d2c1b]" : "border-green-800 bg-[#092317]/80"}`}>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-700/50 bg-black/20 text-2xl">
                          {group.icon}
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[.2em] text-amber-400">
                            {isPacte ? "À la une" : "Événements de faction"}
                          </p>
                          <h2 className="mt-1 text-2xl font-bold text-white">{group.name}</h2>
                          <p className="mt-1 text-sm text-green-300">{group.description}</p>
                        </div>
                      </div>
                      <span className="rounded-full border border-green-700 px-3 py-1 text-xs font-semibold text-green-300">
                        {items.length} événement{items.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  <div className={isPacte ? "space-y-6" : "grid gap-5 xl:grid-cols-2"}>
                    {items.map((item) => renderEvent(item, isPacte))}
                  </div>
                </section>
              );
            })}

            {grouped.OTHER.length > 0 && (filter === "ALL" || filter === "OTHER") && (
              <section>
                <div className="mb-5 rounded-2xl border border-slate-700 bg-[#0b1711] p-5">
                  <p className="text-xs font-bold uppercase tracking-[.2em] text-slate-400">Autres</p>
                  <h2 className="mt-1 text-2xl font-bold">Événements non classés</h2>
                  <p className="mt-1 text-sm text-green-300">Ces événements utilisent un salon qui n'est pas encore associé à une catégorie.</p>
                </div>
                <div className="grid gap-5 xl:grid-cols-2">
                  {grouped.OTHER.map((item) => renderEvent(item))}
                </div>
              </section>
            )}
          </div>
        )}
        </div>
      </div>
    </main>
  );
}
