"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getFaction, getFactionMembership, getFactionOrders, updateOrderStatus, type Faction, type FactionId, type FactionOrder, type OrderStatus } from "@/services/factions.service";
import OrderStatusBadge from "@/components/factions/OrderStatusBadge";

const actions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["ACCEPTED", "REFUSED", "CANCELLED"],
  ACCEPTED: ["IN_PROGRESS", "REFUSED", "CANCELLED"],
  IN_PROGRESS: ["READY", "CANCELLED"],
  READY: ["COMPLETED", "IN_PROGRESS"],
  COMPLETED: [],
  REFUSED: [],
  CANCELLED: [],
};

const actionLabel: Record<OrderStatus, string> = {
  PENDING: "Accepter",
  ACCEPTED: "Prendre en charge",
  IN_PROGRESS: "Marquer comme prête",
  READY: "Marquer comme livrée",
  COMPLETED: "Terminée",
  REFUSED: "Refuser",
  CANCELLED: "Annuler",
};

export default function AdminFactionPage() {
  const params = useParams<{ factionId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const factionId = params.factionId as FactionId;
  const [faction, setFaction] = useState<Faction | null>(null);
  const [orders, setOrders] = useState<FactionOrder[]>([]);
  const [leader, setLeader] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try {
      const [a, m, o] = await Promise.all([getFaction(factionId), getFactionMembership(), getFactionOrders(factionId)]);
      setFaction(a);
      setLeader(user?.role === "OWNER" || Boolean(m.find((x) => x.factionId === factionId)?.leader));
      setOrders(o);
    } catch (e) { setError(e instanceof Error ? e.message : "Impossible de charger les commandes."); }
  }

  useEffect(() => { if (user) void load(); }, [factionId, user]);

  async function act(orderId: string, status: OrderStatus) {
    try { setError(""); await updateOrderStatus(orderId, status); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Action impossible."); }
  }

  if (!faction) return <main className="min-h-screen bg-[#071a11] p-10 text-white">{error || "Chargement…"}</main>;

  return <main className="min-h-screen bg-[#071a11] px-6 py-10 text-white"><div className="mx-auto max-w-6xl">
    <div className="flex justify-between gap-4"><div><div className="text-4xl">{faction.icon}</div><h1 className="mt-2 text-3xl font-bold text-amber-200">{faction.name}</h1></div><button onClick={() => router.push(`/factions/${factionId}`)} className="text-sm text-amber-300 underline">Voir l'espace membre</button></div>
    {!leader && <p className="mt-5 rounded-lg border border-amber-800 bg-amber-950/20 p-4 text-amber-200">Vous pouvez consulter les commandes, mais seul le chef de faction ou le propriétaire peut les gérer.</p>}
    {error && <p className="mt-4 rounded-lg bg-red-950/50 p-3 text-red-200">{error}</p>}
    <div className="mt-8 space-y-4">{orders.map((o) => <article key={o.orderId} className={`rounded-2xl border border-emerald-900 bg-[#06150d] p-5 ${o.archivedAt ? "opacity-70" : ""}`}>
      <div className="flex flex-wrap justify-between gap-4"><div><p className="text-xs text-emerald-500">{o.orderId} · {o.source === "CLAN" ? "Commande de clan" : "Commande membre"}</p><h2 className="mt-1 text-lg font-bold text-emerald-100">{o.title}</h2><p className="mt-1 text-sm text-emerald-400">{o.visibility === "PRIVATE" ? "Commande privée" : "Commande publique"}</p></div><OrderStatusBadge status={o.status}/></div>
      <div className="mt-4 flex flex-wrap gap-2">{o.items.map((i, n) => <span key={n} className="rounded-lg bg-emerald-950 px-3 py-2 text-sm text-emerald-100">{i.quantity} × {i.name}</span>)}</div>
      {o.message && <p className="mt-4 whitespace-pre-line text-sm text-emerald-300">{o.message}</p>}
      {leader && !o.archivedAt && <div className="mt-5 flex flex-wrap gap-2">{actions[o.status].map((s) => <button key={s} onClick={() => void act(o.orderId, s)} className="rounded-lg bg-amber-700 px-3 py-2 text-sm font-semibold">{actionLabel[s]}</button>)}</div>}
    </article>)}
    {!orders.length && <p className="text-emerald-300">Aucune commande.</p>}
    </div></div></main>;
}
