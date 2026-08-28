"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getUpcomingClanEvents,
  setClanEventParticipation,
  removeClanEventParticipation,
  type ClanEventWithParticipation,
  type ParticipationStatus,
} from "@/services/clan-events.service";

const labels: Record<string, string> = {
  COLLECTE: "Collecte", COMBAT: "Combat", CEREMONIE: "Cérémonie",
  REUNION: "Réunion", SORTIE: "Sortie", AUTRE: "Événement",
};
const responses: Record<ParticipationStatus, string> = {
  ACCEPTED: "Je participe", MAYBE: "Peut-être", DECLINED: "Je ne participe pas",
};

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date inconnue" :
    date.toLocaleString("fr-FR", {
      weekday: "long", day: "numeric", month: "long",
      year: "numeric", hour: "2-digit", minute: "2-digit",
    });
}

export default function EvenementsPage() {
  const [events, setEvents] = useState<ClanEventWithParticipation[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true); setError("");
      setEvents(await getUpcomingClanEvents());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de charger les événements.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function respond(eventId: string, status: ParticipationStatus) {
    try {
      setBusy(eventId); setError("");
      await setClanEventParticipation(eventId, status);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible d'enregistrer votre réponse.");
    } finally { setBusy(null); }
  }

  async function clear(eventId: string) {
    try {
      setBusy(eventId); setError("");
      await removeClanEventParticipation(eventId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de retirer votre réponse.");
    } finally { setBusy(null); }
  }

  return (
    <main className="min-h-screen bg-green-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-400">Le Pacte du Chêne</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold">Événements</h1>
              <p className="mt-3 max-w-3xl text-green-300">
                Retrouvez les prochains rendez-vous du Pacte et indiquez votre présence.
              </p>
            </div>
            <button onClick={load} disabled={loading}
              className="rounded-lg bg-amber-600 px-5 py-3 font-semibold hover:bg-amber-500 disabled:opacity-50">
              {loading ? "Chargement..." : "Actualiser"}
            </button>
          </div>
        </header>

        {error && <div className="mb-6 rounded-xl border border-red-700 bg-red-950/40 p-5 text-red-300">{error}</div>}

        {!loading && events.length === 0 && (
          <section className="rounded-2xl border border-green-800 bg-green-900/40 p-12 text-center">
            <div className="text-5xl">🌳</div>
            <h2 className="mt-4 text-2xl font-bold">Aucun événement à venir</h2>
            <p className="mt-2 text-green-300">Le calendrier du Pacte est actuellement calme.</p>
          </section>
        )}

        <div className="space-y-6">
          {events.map(({ event, participation, counts }) => (
            <article key={event.eventId} className="overflow-hidden rounded-2xl border border-green-800 bg-green-900/50">
              <div className="border-b border-green-800 bg-green-900/70 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <span className="rounded-full bg-amber-600/20 px-3 py-1 text-xs font-bold uppercase text-amber-300">
                      {labels[event.type] ?? "Événement"}
                    </span>
                    <h2 className="mt-3 text-2xl font-bold">{event.title}</h2>
                  </div>
                  {participation && <span className="rounded-full border border-green-600 bg-green-950 px-4 py-2 text-sm text-green-200">
                    {responses[participation]}
                  </span>}
                </div>
              </div>

              <div className="p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-green-800 bg-green-950/50 p-4">
                    <p className="text-xs font-bold uppercase text-amber-400">Date</p>
                    <p className="mt-2 font-semibold text-green-100">{dateLabel(event.startsAt)}</p>
                  </div>
                  {event.location && <div className="rounded-xl border border-green-800 bg-green-950/50 p-4">
                    <p className="text-xs font-bold uppercase text-amber-400">Lieu</p>
                    <p className="mt-2 font-semibold text-green-100">{event.location}</p>
                  </div>}
                </div>

                {event.description && <p className="mt-5 whitespace-pre-line text-green-200">{event.description}</p>}
                {event.discordChannel && <p className="mt-4 text-sm text-indigo-300">Discord · {event.discordChannel}</p>}

                <div className="mt-6 border-t border-green-800 pt-5">
                  <div className="flex flex-wrap gap-3">
                    {(Object.keys(responses) as ParticipationStatus[]).map(status => (
                      <button key={status} disabled={busy === event.eventId}
                        onClick={() => respond(event.eventId, status)}
                        className={`rounded-lg border px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
                          participation === status
                            ? "border-amber-400 bg-amber-600 text-white"
                            : "border-green-700 bg-green-950 text-green-200 hover:border-amber-500"
                        }`}>
                        {responses[status]}
                      </button>
                    ))}
                    {participation && <button onClick={() => clear(event.eventId)} disabled={busy === event.eventId}
                      className="px-3 py-2 text-sm font-semibold text-green-400 hover:text-white disabled:opacity-50">
                      Effacer ma réponse
                    </button>}
                  </div>
                  <div className="mt-5 flex flex-wrap gap-5 text-sm">
                    <span className="text-green-300"><strong className="text-green-100">{counts.ACCEPTED}</strong> participant{counts.ACCEPTED > 1 ? "s" : ""}</span>
                    <span className="text-amber-300"><strong className="text-amber-100">{counts.MAYBE}</strong> peut-être</span>
                    <span className="text-red-300"><strong className="text-red-100">{counts.DECLINED}</strong> absent{counts.DECLINED > 1 ? "s" : ""}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
