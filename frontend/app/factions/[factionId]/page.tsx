"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  getFaction,
  getFactionMembership,
  getFactionOrders,
  type Faction,
  type FactionId,
  type FactionOrder,
} from "@/services/factions.service";
import OrderStatusBadge from "@/components/factions/OrderStatusBadge";

type FactionTheme = {
  image: string;
  eyebrow: string;
  accentText: string;
  accentBorder: string;
  accentBorderSoft: string;
  accentBg: string;
  accentBgSoft: string;
  accentHover: string;
  glow: string;
  panel: string;
  panelHover: string;
};

const FACTION_THEMES: Record<string, FactionTheme> = {
  "domaine-du-chene": {
    image: "/images/pacte/faction-domaine.png",
    eyebrow: "Territoire · Ressources · Approvisionnement",
    accentText: "text-emerald-300",
    accentBorder: "border-emerald-700/70",
    accentBorderSoft: "border-emerald-900/70",
    accentBg: "bg-emerald-950/40",
    accentBgSoft: "bg-emerald-950/20",
    accentHover: "hover:border-emerald-500/70",
    glow: "bg-[radial-gradient(circle_at_75%_18%,rgba(34,197,94,0.18),transparent_32%)]",
    panel: "bg-[#071a11]/95",
    panelHover: "hover:bg-[#0a2116]",
  },
  "guilde-des-artisans": {
    image: "/images/pacte/faction-artisans.png",
    eyebrow: "Forge · Savoir-faire · Équipement",
    accentText: "text-sky-300",
    accentBorder: "border-sky-700/70",
    accentBorderSoft: "border-sky-900/70",
    accentBg: "bg-sky-950/40",
    accentBgSoft: "bg-sky-950/20",
    accentHover: "hover:border-sky-500/70",
    glow: "bg-[radial-gradient(circle_at_75%_18%,rgba(14,165,233,0.18),transparent_32%)]",
    panel: "bg-[#07131a]/95",
    panelHover: "hover:bg-[#0a1d27]",
  },
  "confrerie-de-lepee": {
    image: "/images/pacte/faction-confrerie.png",
    eyebrow: "Combat · Chasse · Récupération",
    accentText: "text-red-300",
    accentBorder: "border-red-800/70",
    accentBorderSoft: "border-red-950/70",
    accentBg: "bg-red-950/40",
    accentBgSoft: "bg-red-950/20",
    accentHover: "hover:border-red-500/70",
    glow: "bg-[radial-gradient(circle_at_75%_18%,rgba(220,38,38,0.18),transparent_32%)]",
    panel: "bg-[#1a0909]/95",
    panelHover: "hover:bg-[#250d0d]",
  },
};

const DEFAULT_THEME: FactionTheme = {
  image: "/images/pacte/faction-domaine.png",
  eyebrow: "Faction du Pacte du Chêne",
  accentText: "text-amber-300",
  accentBorder: "border-amber-800/70",
  accentBorderSoft: "border-emerald-900/70",
  accentBg: "bg-amber-950/30",
  accentBgSoft: "bg-amber-950/15",
  accentHover: "hover:border-amber-500/70",
  glow: "bg-[radial-gradient(circle_at_75%_18%,rgba(245,158,11,0.16),transparent_32%)]",
  panel: "bg-[#06150d]/95",
  panelHover: "hover:bg-[#0a2116]",
};

export default function FactionPage() {
  const params = useParams<{ factionId: string }>();
  const id = params.factionId as FactionId;

  const [faction, setFaction] = useState<Faction | null>(null);
  const [orders, setOrders] = useState<FactionOrder[]>([]);
  const [member, setMember] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.all([getFaction(id), getFactionMembership()])
      .then(async ([loadedFaction, memberships]) => {
        const isMember = Boolean(
          memberships.find((x) => x.factionId === id)?.member,
        );

        setFaction(loadedFaction);
        setMember(isMember);

        if (isMember) {
          setOrders(await getFactionOrders(id));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !faction) {
    return (
      <main className="min-h-screen bg-[#071a11] p-10 text-white">
        {loading ? "Chargement…" : "Faction introuvable."}
      </main>
    );
  }

  const theme = FACTION_THEMES[id] ?? DEFAULT_THEME;
  const publicOrders = orders.filter((order) => order.visibility === "PUBLIC");

  return (
    <>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&display=swap");

        .faction-medieval {
          font-family: "Cinzel", "Palatino Linotype", "Book Antiqua", Georgia, serif;
        }
      `}</style>
    <main className={`relative min-h-screen overflow-hidden bg-[#050b08] px-6 py-10 text-white ${theme.glow}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(180,130,40,0.06),transparent_28%)]" />

      <div className="relative mx-auto max-w-6xl">
        {/* Hero */}
        <header className={`relative overflow-hidden rounded-2xl border ${theme.accentBorder} ${theme.panel} shadow-2xl`}>
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/10" />

          <div className="relative grid min-h-[360px] items-center gap-4 lg:grid-cols-[1fr_390px]">
            <div className="px-7 py-9 lg:px-10 lg:py-12">
              <p className={`faction-medieval text-xs font-semibold uppercase tracking-[0.28em] ${theme.accentText}`}>
                {theme.eyebrow}
              </p>

              <h1 className="faction-medieval mt-4 text-4xl font-bold tracking-wide text-amber-200 sm:text-5xl">
                {faction.name}
              </h1>

              <div className="mt-5 h-px w-28 bg-gradient-to-r from-amber-500/80 to-transparent" />

              <p className="mt-5 max-w-2xl text-base leading-7 text-emerald-100/85">
                {faction.description}
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href="/espace-membre/commandes"
                  className="rounded-lg bg-amber-700 px-5 py-2.5 font-semibold text-white shadow-lg transition hover:bg-amber-600"
                >
                  Passer une commande
                </Link>

                {member && (
                  <span className={`rounded-lg border ${theme.accentBorder} ${theme.accentBg} px-4 py-2 text-sm ${theme.accentText}`}>
                    Vous appartenez à cette faction
                  </span>
                )}
              </div>
            </div>

            <div className="relative flex h-full min-h-[300px] items-center justify-center px-5 pb-4 pt-2 lg:min-h-[360px] lg:px-8">
              <div className="absolute inset-y-8 left-0 hidden w-px bg-gradient-to-b from-transparent via-amber-700/40 to-transparent lg:block" />
              <img
                src={theme.image}
                alt={faction.name}
                className="relative z-10 object-contain drop-shadow-[0_18px_35px_rgba(0,0,0,0.65)] transition duration-500 hover:scale-[1.03]"
                style={{ width: "250px", height: "250px" }}
              />
            </div>
          </div>
        </header>

        {/* Main information */}
        <section className="mt-6 grid gap-5 lg:grid-cols-[1.45fr_0.85fr]">
          <article className={`rounded-2xl border ${theme.accentBorderSoft} ${theme.panel} p-7`}>
            <p className={`faction-medieval text-xs font-semibold uppercase tracking-[0.2em] ${theme.accentText}`}>
              L'identité de la faction
            </p>
            <h2 className="faction-medieval mt-2 text-2xl font-bold text-amber-200">
              Présentation
            </h2>
            <p className="mt-4 leading-7 text-emerald-100/85">
              {faction.description}
            </p>
            <p className="mt-5 text-sm leading-6 text-emerald-300/70">
              Cette page est la vitrine de la faction. Sa présentation détaillée, ses actualités
              et ses événements pourront être alimentés par son chef depuis l'administration.
            </p>

            <div className={`mt-7 rounded-xl border ${theme.accentBorderSoft} ${theme.accentBgSoft} p-5`}>
              <p className={`faction-medieval text-xs font-semibold uppercase tracking-[0.18em] ${theme.accentText}`}>
                Esprit de la faction
              </p>
              <p className="mt-2 text-sm leading-6 text-emerald-100/75">
                Une branche du Pacte avec son rôle, ses activités et ses responsabilités propres.
              </p>
            </div>
          </article>

          <aside className={`rounded-2xl border ${theme.accentBorderSoft} ${theme.panel} p-7`}>
            <p className={`faction-medieval text-xs font-semibold uppercase tracking-[0.2em] ${theme.accentText}`}>
              À découvrir
            </p>

            <div className="mt-5 space-y-3">
              {[
                "Actualités de la faction",
                "Événements de la faction",
                "Répertoire des commandes",
              ].map((label) => (
                <div
                  key={label}
                  className={`rounded-lg border ${theme.accentBorderSoft} ${theme.accentBgSoft} p-3.5 text-sm text-emerald-100 transition ${theme.panelHover} ${theme.accentHover}`}
                >
                  {label}
                </div>
              ))}
            </div>
          </aside>
        </section>

        {/* Orders */}
        <section className={`mt-6 rounded-2xl border ${theme.accentBorderSoft} ${theme.panel} p-7`}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className={`faction-medieval text-xs font-semibold uppercase tracking-[0.2em] ${theme.accentText}`}>
                Activité
              </p>
              <h2 className="faction-medieval mt-1 text-2xl font-bold text-amber-200">
                Répertoire des commandes
              </h2>
              <p className="mt-1 text-sm text-emerald-300/70">
                Les commandes publiques confiées à cette faction.
              </p>
            </div>

            {!member && (
              <span className="text-xs text-amber-300">
                Réservé aux membres de la faction
              </span>
            )}
          </div>

          {!member ? (
            <div className={`mt-5 rounded-xl border border-amber-800/50 ${theme.accentBgSoft} p-5 text-sm text-amber-200`}>
              Vous pouvez découvrir cette faction et lui adresser une commande depuis
              <Link href="/espace-membre/commandes" className="mx-1 underline">
                Mes commandes
              </Link>
              , mais son répertoire de commandes est réservé à ses membres.
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {publicOrders.map((order) => (
                <Link
                  key={order.orderId}
                  href={`/espace-membre/commandes/${order.orderId}`}
                  className={`block rounded-xl border ${theme.accentBorderSoft} bg-[#071a11]/80 p-4 transition ${theme.accentHover} ${theme.panelHover}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-emerald-100">{order.title}</p>
                      <p className="mt-1 text-xs text-emerald-500">{order.orderId}</p>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>
                </Link>
              ))}

              {!publicOrders.length && (
                <p className={`rounded-xl border ${theme.accentBorderSoft} p-6 text-emerald-300`}>
                  Aucune commande publique à afficher.
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
    </>
  );
}
