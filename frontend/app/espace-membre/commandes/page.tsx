"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getFactions,
  getMyOrders,
  type Faction,
  type FactionId,
  type FactionOrder,
  type OrderStatus,
} from "@/services/factions.service";
import OrderStatusBadge from "@/components/factions/OrderStatusBadge";
import OrderForm from "@/components/factions/OrderForm";

const kindForFaction = (id: FactionId) =>
  id === "domaine-du-chene"
    ? ("RESOURCE" as const)
    : id === "guilde-des-artisans"
      ? ("CRAFT" as const)
      : ("LOOT" as const);

const themes: Record<
  FactionId,
  {
    accent: string;
    border: string;
    soft: string;
    icon: string;
    glow: string;
  }
> = {
  "domaine-du-chene": {
    accent: "text-emerald-300",
    border: "border-emerald-700/60",
    soft: "bg-emerald-950/50",
    icon: "/images/pacte/faction-domaine.png",
    glow: "shadow-[0_0_30px_rgba(16,185,129,0.08)]",
  },
  "guilde-des-artisans": {
    accent: "text-sky-300",
    border: "border-sky-700/60",
    soft: "bg-sky-950/50",
    icon: "/images/pacte/faction-artisans.png",
    glow: "shadow-[0_0_30px_rgba(14,165,233,0.08)]",
  },
  "confrerie-de-lepee": {
    accent: "text-red-300",
    border: "border-red-800/60",
    soft: "bg-red-950/45",
    icon: "/images/pacte/faction-confrerie.png",
    glow: "shadow-[0_0_30px_rgba(239,68,68,0.08)]",
  },
};

const steps: { status: OrderStatus; label: string }[] = [
  { status: "PENDING", label: "Reçue" },
  { status: "ACCEPTED", label: "Acceptée" },
  { status: "IN_PROGRESS", label: "En cours" },
  { status: "READY", label: "Prête" },
  { status: "COMPLETED", label: "Livrée" },
];

function date(value?: string) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? null
    : new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(d);
}

function summary(order: FactionOrder) {
  const total = order.items.reduce((n, i) => n + i.quantity, 0);
  const first = order.items[0]?.name;

  if (!first) return "Commande personnalisée";
  if (order.items.length === 1) {
    return `${first} · ${total} exemplaire${total > 1 ? "s" : ""}`;
  }

  return `${first} · ${order.items.length} objets`;
}

function Progress({ status }: { status: OrderStatus }) {
  if (status === "REFUSED" || status === "CANCELLED") return null;

  const current = Math.max(
    0,
    steps.findIndex((step) => step.status === status),
  );

  return (
    <div className="mt-6 rounded-xl border-2 border-emerald-900/60 px-4 py-4 sm:px-5" style={{ backgroundColor: "rgba(7, 27, 18, 0.97)" }}>
      <div className="flex items-start">
        {steps.map((step, i) => {
          const done = i <= current;
          const isCurrent = i === current;

          return (
            <div
              key={step.status}
              className="flex min-w-0 flex-1 items-start"
            >
              <div className="flex min-w-0 flex-1 flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border text-[11px] font-bold transition ${
                    done
                      ? "border-amber-500 bg-amber-500/15 text-amber-200"
                      : "border-emerald-900 text-emerald-700"
                  } ${isCurrent ? "ring-2 ring-amber-500/20 ring-offset-2 ring-offset-[#071b12]" : ""}`}
                >
                  {done ? "✓" : i + 1}
                </div>

                <span
                  className={`mt-2 text-center text-[9px] font-semibold uppercase tracking-[0.1em] sm:text-[10px] ${
                    done ? "text-emerald-300" : "text-emerald-700"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {i < steps.length - 1 && (
                <div
                  className={`mt-4 h-px flex-1 ${
                    i < current ? "bg-amber-700/70" : "bg-emerald-900"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<FactionOrder[]>([]);
  const [factions, setFactions] = useState<Faction[]>([]);
  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function loadOrders() {
    setOrders(await getMyOrders());
  }

  useEffect(() => {
    void Promise.all([getMyOrders(), getFactions()])
      .then(([o, f]) => {
        setOrders(o);
        setFactions(f);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const active = useMemo(() => orders.filter((o) => !o.archivedAt), [orders]);
  const archived = useMemo(() => orders.filter((o) => !!o.archivedAt), [orders]);

  const pending = active.filter((o) => o.status === "PENDING").length;
  const accepted = active.filter((o) => o.status === "ACCEPTED").length;
  const inProgress = active.filter((o) => o.status === "IN_PROGRESS").length;
  const ready = active.filter((o) => o.status === "READY").length;
  const delivered = orders.filter((o) => o.status === "COMPLETED").length;

  const stats = [
    { label: "En attente", value: pending },
    { label: "Acceptées", value: accepted },
    { label: "En cours", value: inProgress },
    { label: "Prêtes", value: ready },
    { label: "Livrées", value: delivered },
  ];

  const renderCard = (order: FactionOrder, compact = false) => {
    const faction = factions.find((f) => f.factionId === order.factionId);
    const theme = themes[order.factionId] ?? themes["domaine-du-chene"];

    return (
      <button
        key={order.orderId}
        type="button"
        onClick={() =>
          router.push(`/espace-membre/commandes/${order.orderId}`)
        }
        className={`group w-full border backdrop-blur-sm text-left transition hover:-translate-y-0.5 hover:border-amber-700/70 ${
          compact ? "p-4" : "p-5 sm:p-6"
        }`}
        style={{ backgroundColor: "rgba(6, 21, 13, 0.97)" }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 ${theme.border} ${theme.soft} text-xl ${theme.accent}`}
            >
              <img
                src={theme.icon}
                alt={faction?.name ?? "Faction"}
                className="h-9 w-9 object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]"
              />
            </div>

            <div className="min-w-0">
              <div
                className={`text-[10px] font-bold uppercase tracking-[0.18em] ${theme.accent}`}
              >
                {faction?.shortName ?? "Faction"}
              </div>

              <h3 className="mt-1 truncate text-lg font-bold text-emerald-50 sm:text-xl">
                {order.title}
              </h3>

              <p className="mt-1 text-[11px] text-emerald-500/80">
                {order.orderId}
                {date(order.createdAt) ? ` · ${date(order.createdAt)}` : ""}
              </p>
            </div>
          </div>

          <div className="shrink-0 self-start">
            <OrderStatusBadge status={order.status} />
          </div>
        </div>

        {compact ? (
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-emerald-900/60 pt-3">
            <span className="text-xs text-emerald-400/80">
              {summary(order)}
            </span>
            <span className="text-sm font-semibold text-amber-300 transition group-hover:translate-x-1">
              Détails →
            </span>
          </div>
        ) : (
          <>
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-emerald-200/85">
              <span className="font-medium">{summary(order)}</span>

              {order.recipeIngredients?.length ? (
                <span className="rounded-full border border-emerald-900/70 bg-emerald-950/40 px-3 py-1 text-xs text-emerald-400">
                  {order.recipeIngredients.length} composant
                  {order.recipeIngredients.length > 1 ? "s" : ""}
                </span>
              ) : null}
            </div>

            <Progress status={order.status} />

            <div className="mt-5 flex flex-col gap-3 border-t border-emerald-900/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-emerald-500">
                {order.statusMessage ||
                  "Consulter le détail de la commande"}
              </span>

              <span className="text-sm font-semibold text-amber-300 transition group-hover:translate-x-1">
                Voir la commande →
              </span>
            </div>
          </>
        )}
      </button>
    );
  };

  return (
    <main
      className="relative isolate min-h-screen overflow-hidden px-4 py-8 text-white sm:px-6 lg:py-10"
      style={{
        backgroundImage: "url('/images/backgrounds/commandes-background.png')",
        backgroundPosition: "center top",
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Voile sombre : conserve la lisibilité tout en laissant apparaître le décor. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,rgba(2,12,8,0.78),rgba(3,18,11,0.84)_45%,rgba(3,12,8,0.94))]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-emerald-950/10"
      />

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Header */}
        <header className="overflow-hidden rounded-2xl border-2 border-emerald-900/80 shadow-[0_15px_50px_rgba(0,0,0,0.18)]" style={{ backgroundColor: "rgba(6, 21, 13, 0.97)" }}>
          <div className="border-b border-emerald-900/70 bg-gradient-to-r from-emerald-950/25 via-transparent to-amber-950/10 px-6 py-7 sm:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-amber-500">
                  Espace membre · Économie
                </p>

                <h1 className="mt-2 text-3xl font-bold tracking-tight text-amber-200 sm:text-4xl">
                  Mes commandes
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-200/70">
                  Passez commande auprès des factions du Pacte et suivez chaque
                  étape de leur traitement.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="w-full rounded-lg border border-amber-500/70 bg-amber-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-amber-950/20 transition hover:bg-amber-600 sm:w-auto"
              >
                {open ? "Fermer" : "+ Nouvelle commande"}
              </button>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 divide-x divide-y divide-emerald-900/70 sm:grid-cols-5 sm:divide-y-0">
            {stats.map((stat) => (
              <div key={stat.label} className="px-5 py-5 sm:px-4">
                <p className="text-2xl font-bold text-amber-200">
                  {stat.value}
                </p>
                <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.15em] text-emerald-500 sm:text-[10px]">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </header>

        {/* New order */}
        {open && (
          <section className="mt-5 rounded-2xl border-2 border-emerald-900/80 p-5 shadow-[0_15px_45px_rgba(0,0,0,0.14)] sm:p-6" style={{ backgroundColor: "rgba(6, 21, 13, 0.97)" }}>
            <div className="border-b border-emerald-900/70 pb-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500">
                Nouvelle demande
              </p>
              <h2 className="mt-1 text-xl font-bold text-amber-200">
                Choisir une faction
              </h2>
              <p className="mt-1 text-sm text-emerald-300/65">
                Vous pouvez commander auprès de n'importe quelle faction, même
                si vous n'en êtes pas membre.
              </p>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {factions.map((faction) => {
                const theme =
                  themes[faction.factionId] ??
                  themes["domaine-du-chene"];
                const selected =
                  selectedFaction?.factionId === faction.factionId;

                return (
                  <button
                    key={faction.factionId}
                    type="button"
                    onClick={() => setSelectedFaction(faction)}
                    className={`group rounded-xl border-2 p-4 text-left transition ${
                      selected
                        ? `${theme.border} ${theme.soft} ring-1 ring-amber-500/30`
                        : "border-emerald-900/80 hover:border-emerald-700/80"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg border-2 ${theme.border} ${theme.soft} text-xl ${theme.accent}`}
                      >
                        <img
                          src={theme.icon}
                          alt={faction.name}
                          className="h-8 w-8 object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-amber-200">
                          {faction.name}
                        </p>
                        <p className={`text-[9px] font-bold uppercase tracking-[0.15em] ${theme.accent}`}>
                          {faction.shortName}
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 text-xs leading-5 text-emerald-300/65">
                      {faction.description}
                    </p>

                    <div
                      className={`mt-3 text-xs font-semibold ${
                        selected ? "text-amber-300" : "text-emerald-600"
                      }`}
                    >
                      {selected ? "Faction sélectionnée ✓" : "Sélectionner →"}
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedFaction && (
              <div className="mt-6 border-t border-emerald-900/70 pt-6">
                <OrderForm
                  faction={selectedFaction}
                  kind={kindForFaction(selectedFaction.factionId)}
                  onCreated={(id) => {
                    setOpen(false);
                    setSelectedFaction(null);
                    void loadOrders();
                    router.push(`/espace-membre/commandes/${id}`);
                  }}
                />
              </div>
            )}
          </section>
        )}

        {/* Active orders */}
        {loading ? (
          <div className="mt-8 rounded-2xl border-2 border-emerald-900/80 p-6 text-sm text-emerald-300" style={{ backgroundColor: "rgba(6, 21, 13, 0.97)" }}>
            Chargement de vos commandes…
          </div>
        ) : (
          <>
            <section className="mt-9">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500">
                    Suivi
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-amber-200">
                    Commandes en cours
                  </h2>
                </div>

                <span className="rounded-full border-2 border-emerald-900/70 px-3 py-1 text-[10px] font-semibold text-emerald-500" style={{ backgroundColor: "rgba(6, 21, 13, 0.97)" }}>
                  {active.length} active{active.length > 1 ? "s" : ""}
                </span>
              </div>

              <div className="space-y-4">
                {active.map((o) => renderCard(o))}

                {!active.length && (
                  <div className="rounded-2xl border-2 border-dashed border-emerald-900 px-6 py-12 text-center" style={{ backgroundColor: "rgba(6, 21, 13, 0.97)" }}>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-emerald-900 text-xl text-emerald-700">
                      ◇
                    </div>
                    <h3 className="mt-4 font-semibold text-emerald-100">
                      Aucune commande en cours
                    </h3>
                    <p className="mx-auto mt-1 max-w-md text-sm text-emerald-500">
                      Vos prochaines demandes auprès des factions du Pacte
                      apparaîtront ici.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* History */}
            {archived.length > 0 && (
              <section className="mt-10 pb-10">
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500">
                      Historique
                    </p>
                    <h2 className="mt-1 text-2xl font-bold text-amber-200">
                      Commandes archivées
                    </h2>
                  </div>

                  <span className="rounded-full border-2 border-emerald-900/70 px-3 py-1 text-[10px] font-semibold text-emerald-500" style={{ backgroundColor: "rgba(6, 21, 13, 0.97)" }}>
                    {archived.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {archived.map((o) => renderCard(o, true))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}