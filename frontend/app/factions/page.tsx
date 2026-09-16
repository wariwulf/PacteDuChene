"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getFactions,
  getFactionMembership,
  type Faction,
  type FactionMembership,
} from "@/services/factions.service";

const FACTION_IMAGES: Record<string, string> = {
  "domaine-du-chene": "/images/pacte/faction-domaine.png",
  "guilde-des-artisans": "/images/pacte/faction-artisans.png",
  "confrerie-de-lepee": "/images/pacte/faction-confrerie.png",
};

export default function FactionsPage() {
  const [factions, setFactions] = useState<Faction[]>([]);
  const [membership, setMembership] = useState<FactionMembership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.all([getFactions(), getFactionMembership()])
      .then(([loadedFactions, loadedMembership]) => {
        setFactions(loadedFactions);
        setMembership(loadedMembership);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-[#071a11] px-6 py-10 text-white">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&display=swap");

        .factions-medieval {
          font-family: "Cinzel", "Palatino Linotype", "Book Antiqua", Georgia, serif;
        }
      `}</style>

      <div className="mx-auto max-w-7xl">
        <header className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-500">
            Le Pacte du Chêne
          </p>

          <h1 className="factions-medieval mt-3 text-4xl font-bold tracking-wide text-amber-200 md:text-5xl">
            Les Factions du Pacte
          </h1>

          <div className="mx-auto mt-5 flex items-center justify-center gap-4">
            <span className="h-px w-16 bg-amber-700/60" />
            <span className="text-amber-600/80">◆</span>
            <span className="h-px w-16 bg-amber-700/60" />
          </div>

          <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-emerald-200/80">
            Découvrez les trois branches du Pacte, leur rôle, leur actualité,
            leurs événements et les commandes qui leur sont confiées.
          </p>
        </header>

        {loading ? (
          <p className="mt-10 text-center text-emerald-300">
            Chargement des factions…
          </p>
        ) : (
          <div className="mx-auto mt-10 grid max-w-7xl gap-8 md:grid-cols-3">
            {factions.map((faction) => {
              const isMember = Boolean(
                membership.find((m) => m.factionId === faction.factionId)?.member,
              );

              const image = FACTION_IMAGES[faction.factionId];

              return (
                <Link
                  key={faction.factionId}
                  href={`/factions/${faction.factionId}`}
                  className="group relative flex min-h-[620px] flex-col overflow-hidden rounded-lg border border-emerald-900/80 bg-[#081b12] shadow-lg shadow-black/20 transition duration-300 hover:-translate-y-1 hover:border-amber-500/70 hover:shadow-2xl hover:shadow-black/40"
                >
                  <div className="relative flex h-[315px] shrink-0 items-center justify-center overflow-hidden bg-[#06150d] px-6 pt-4">
                    {image ? (
                      <img
                        src={image}
                        alt={`Illustration de ${faction.name}`}
                        className="h-[285px] w-full object-contain transition duration-700 group-hover:scale-[1.03]"
                      />
                    ) : null}

                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#081b12] to-transparent" />

                  </div>

                  <div className="flex flex-1 flex-col items-center px-7 pb-7 pt-2 text-center">
                    <h2 className="factions-medieval text-xl font-bold tracking-wide text-amber-200 transition group-hover:text-amber-100">
                      {faction.name}
                    </h2>

                    <div className="mt-3 flex w-full items-center justify-center">
                      <img
                        src="/images/pacte/section-divider.png"
                        alt=""
                        aria-hidden="true"
                        className="h-8 w-48 object-contain opacity-90 transition duration-300 group-hover:opacity-100"
                      />
                    </div>

                    <p className="mt-4 flex-1 text-sm leading-6 text-emerald-100/80">
                      {faction.description}
                    </p>

                    {isMember && (
                      <div className="mt-5 rounded-lg border border-emerald-800/80 bg-emerald-950/50 px-3 py-2 text-center text-xs font-semibold text-emerald-400">
                        Vous appartenez à cette faction
                      </div>
                    )}

                    <div className="mt-5 flex w-full items-center justify-between border-t border-emerald-900/70 pt-4 text-sm font-semibold text-amber-500 transition group-hover:text-amber-300">
                      <span>Découvrir la faction</span>
                      <span className="text-lg">→</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
