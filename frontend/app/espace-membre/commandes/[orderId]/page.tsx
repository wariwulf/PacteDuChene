"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  getFactions,
  getOrder,
  type Faction,
  type FactionId,
  type FactionOrder,
  type OrderStatus,
} from "@/services/factions.service";
import OrderStatusBadge from "@/components/factions/OrderStatusBadge";

const themes: Record<FactionId, { accent: string; border: string; icon: string }> = {
  "domaine-du-chene": { accent: "text-emerald-300", border: "border-emerald-700/50", icon: "🌿" },
  "guilde-des-artisans": { accent: "text-sky-300", border: "border-sky-700/50", icon: "⚒" },
  "confrerie-de-lepee": { accent: "text-red-300", border: "border-red-800/50", icon: "⚔" },
};

const steps: { status: OrderStatus; label: string }[] = [
  { status: "PENDING", label: "Reçue" },
  { status: "ACCEPTED", label: "Acceptée" },
  { status: "IN_PROGRESS", label: "En cours" },
  { status: "READY", label: "Prête" },
  { status: "COMPLETED", label: "Livrée" },
];

function formatDate(value?: string) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? null
    : new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
}

function Progress({ status }: { status: OrderStatus }) {
  if (status === "REFUSED" || status === "CANCELLED") {
    return (
      <div
        className="mt-6 border border-red-900/70 px-4 py-4 text-sm text-red-200"
        style={{ backgroundColor: "rgba(55, 8, 8, 0.94)" }}
      >
        Cette commande est {status === "REFUSED" ? "refusée" : "annulée"} et n'est plus en cours de traitement.
      </div>
    );
  }

  const current = Math.max(0, steps.findIndex((s) => s.status === status));

  return (
    <div
      className="mt-6 rounded-xl border border-emerald-900/80 p-5 sm:p-6"
      style={{
        backgroundColor: "rgba(3, 18, 11, 0.92)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      <div className="flex items-center">
        {steps.map((step, i) => (
          <div key={step.status} className="flex min-w-0 flex-1 items-center">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                i <= current
                  ? "border-amber-500 bg-amber-500/25 text-amber-200"
                  : "border-emerald-900 bg-emerald-950/70 text-emerald-700"
              }`}
            >
              {i <= current ? "✓" : i + 1}
            </div>

            {i < steps.length - 1 && (
              <div
                className={`mx-2 h-[2px] flex-1 ${
                  i < current ? "bg-amber-700/80" : "bg-emerald-900"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-5 text-[9px] uppercase tracking-[0.06em] text-emerald-400 sm:text-[10px]">
        {steps.map((s, i) => (
          <span
            key={s.status}
            className={
              i === 0
                ? "text-left"
                : i === steps.length - 1
                  ? "text-right"
                  : "text-center"
            }
          >
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function OrderPage() {
  const params = useParams<{ orderId: string }>();
  const id = params.orderId;
  const [order, setOrder] = useState<FactionOrder | null>(null);
  const [factions, setFactions] = useState<Faction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.all([getOrder(id), getFactions()])
      .then(([o, f]) => {
        setOrder(o);
        setFactions(f);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const faction = useMemo(
    () => factions.find((f) => f.factionId === order?.factionId),
    [factions, order?.factionId],
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-[#071a11] px-6 py-10 text-white">
        <div
          className="mx-auto max-w-5xl border border-emerald-900/80 p-6 text-emerald-300"
          style={{ backgroundColor: "rgba(6, 21, 13, 0.96)" }}
        >
          Chargement de la commande…
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-[#071a11] px-6 py-10 text-white">
        <div
          className="mx-auto max-w-5xl border border-red-900/70 p-6"
          style={{ backgroundColor: "rgba(35, 7, 7, 0.96)" }}
        >
          <p className="text-xs uppercase tracking-[0.2em] text-red-400">
            Commande introuvable
          </p>
          <h1 className="mt-2 text-2xl font-bold text-amber-200">
            Cette commande n'est pas disponible.
          </h1>
          <Link
            href="/espace-membre/commandes"
            className="mt-5 inline-block text-sm font-semibold text-amber-300 underline"
          >
            ← Retour à mes commandes
          </Link>
        </div>
      </main>
    );
  }

  const theme = themes[order.factionId];
  const created = formatDate(order.createdAt);
  const updated = formatDate(order.updatedAt);
  const delivered = formatDate(order.deliveredAt || order.completedAt);

  return (
    <main
      className="relative min-h-screen overflow-hidden px-4 py-8 text-white sm:px-6 lg:py-10"
      style={{
        backgroundColor: "#071a11",
        backgroundImage: "url('/images/backgrounds/commandes-background.png')",
        backgroundPosition: "center top",
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(2,12,8,0.68), rgba(3,18,11,0.76) 45%, rgba(3,12,8,0.88))",
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl">
        <Link
          href="/espace-membre/commandes"
          className="inline-flex rounded-full border border-white/70 px-4 py-2 text-sm font-semibold text-white transition hover:border-amber-400 hover:text-amber-300"
          style={{ backgroundColor: "rgba(4, 15, 9, 0.90)" }}
        >
          ← Mes commandes
        </Link>

        {/* CARTE PRINCIPALE */}
        <header
          className={`mt-5 rounded-2xl border-2 ${theme.border} p-6 shadow-2xl sm:p-8`}
          style={{
            backgroundColor: "rgba(5, 20, 12, 0.95)",
            boxShadow: "0 18px 55px rgba(0,0,0,0.38)",
            backdropFilter: "blur(5px)",
          }}
        >
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${theme.accent}`}>
                {theme.icon} {faction?.shortName ?? "Faction"}
              </p>

              <p className="mt-2 text-xs text-emerald-400">{order.orderId}</p>

              <h1 className="mt-2 text-3xl font-bold text-amber-200 sm:text-4xl">
                {order.title}
              </h1>

              {created && (
                <p className="mt-2 text-sm text-emerald-100/80">
                  Commandée le {created}
                </p>
              )}
            </div>

            <OrderStatusBadge status={order.status} />
          </div>

          <Progress status={order.status} />
        </header>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
          {/* OBJETS */}
          <section
            className="rounded-2xl border border-emerald-900/80 p-6 shadow-xl"
            style={{
              backgroundColor: "rgba(5, 21, 13, 0.95)",
              boxShadow: "0 14px 40px rgba(0,0,0,0.30)",
              backdropFilter: "blur(5px)",
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">
              Contenu
            </p>

            <h2 className="mt-1 text-2xl font-bold text-amber-200">
              Objets demandés
            </h2>

            <div className="mt-5 space-y-3">
              {order.items.map((item, n) => (
                <div
                  key={`${item.itemId}-${n}`}
                  className="flex items-center gap-4 rounded-xl border border-emerald-800/80 p-4"
                  style={{
                    backgroundColor: "rgba(3, 25, 15, 0.94)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.035)",
                  }}
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-lg object-contain"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-emerald-900 bg-emerald-950/80 text-emerald-500">
                      ◇
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-emerald-50">{item.name}</p>
                    <p className="mt-1 text-sm text-emerald-400">
                      Quantité : {item.quantity}
                    </p>
                  </div>

                  {item.externalUrl && (
                    <a
                      href={item.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="hidden rounded-md border border-amber-800/60 bg-amber-950/60 px-3 py-1.5 text-xs font-semibold text-amber-300 underline sm:block"
                    >
                      Pax Dei ↗
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* INFORMATIONS */}
          <aside className="space-y-5">
            <section
              className="rounded-2xl border border-emerald-900/80 p-6 shadow-xl"
              style={{
                backgroundColor: "rgba(5, 21, 13, 0.95)",
                boxShadow: "0 14px 40px rgba(0,0,0,0.30)",
                backdropFilter: "blur(5px)",
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">
                Informations
              </p>

              <dl className="mt-4 space-y-4 text-sm">
                <div className="rounded-lg border border-emerald-900/60 bg-emerald-950/55 p-3">
                  <dt className="text-emerald-500">Faction</dt>
                  <dd className={`mt-1 font-semibold ${theme.accent}`}>
                    {faction?.name ?? order.factionId}
                  </dd>
                </div>

                <div className="rounded-lg border border-emerald-900/60 bg-emerald-950/55 p-3">
                  <dt className="text-emerald-500">Type</dt>
                  <dd className="mt-1 text-emerald-100">
                    {order.kind === "CRAFT"
                      ? "Fabrication"
                      : order.kind === "RESOURCE"
                        ? "Ressources"
                        : order.kind === "LOOT"
                          ? "Butin"
                          : "Commande de clan"}
                  </dd>
                </div>

                {updated && (
                  <div className="rounded-lg border border-emerald-900/60 bg-emerald-950/55 p-3">
                    <dt className="text-emerald-500">Dernière mise à jour</dt>
                    <dd className="mt-1 text-emerald-100">{updated}</dd>
                  </div>
                )}
              </dl>
            </section>

            {order.statusMessage && (
              <section
                className="rounded-2xl border border-amber-900/70 p-6 shadow-xl"
                style={{
                  backgroundColor: "rgba(55, 30, 5, 0.94)",
                  boxShadow: "0 14px 40px rgba(0,0,0,0.30)",
                }}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">
                  Message de suivi
                </p>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-amber-100/95">
                  {order.statusMessage}
                </p>
              </section>
            )}
          </aside>
        </div>

        {/* FABRICATION */}
        {order.recipeIngredients?.length ? (
          <section
            className="mt-5 rounded-2xl border border-amber-900/70 p-6 shadow-xl sm:p-7"
            style={{
              backgroundColor: "rgba(45, 26, 5, 0.94)",
              boxShadow: "0 14px 40px rgba(0,0,0,0.30)",
              backdropFilter: "blur(5px)",
            }}
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">
                  Fabrication
                </p>
                <h2 className="mt-1 text-2xl font-bold text-amber-200">
                  Ingrédients nécessaires
                </h2>
              </div>

              <span className="text-xs text-amber-300/80">
                Quantités pour la commande
              </span>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {order.recipeIngredients.map((i, n) => (
                <div
                  key={`${i.itemId ?? i.name}-${n}`}
                  className="flex items-center justify-between rounded-lg border border-amber-900/50 px-4 py-3"
                  style={{ backgroundColor: "rgba(30, 20, 6, 0.88)" }}
                >
                  <span className="text-sm text-amber-100">{i.name}</span>
                  <span className="ml-4 shrink-0 text-sm font-bold text-amber-300">
                    × {i.quantity}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* PRÉCISIONS */}
        {order.message && (
          <section
            className="mt-5 rounded-2xl border border-emerald-900/80 p-6 shadow-xl"
            style={{
              backgroundColor: "rgba(5, 21, 13, 0.95)",
              boxShadow: "0 14px 40px rgba(0,0,0,0.30)",
              backdropFilter: "blur(5px)",
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">
              Précisions
            </p>

            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-emerald-100/95">
              {order.message}
            </p>
          </section>
        )}

        {delivered && (
          <section className="mb-10 mt-5 rounded-xl border border-emerald-900/60 px-5 py-4" style={{ backgroundColor: "rgba(3, 18, 11, 0.88)" }}>
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-xs text-emerald-400">
              <span>Livrée le {delivered}</span>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
