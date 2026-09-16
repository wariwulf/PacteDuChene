"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getFactions, getFactionOrders, updateFaction, updateOrderStatus, type Faction, type FactionId, type FactionOrder, type OrderStatus } from "@/services/factions.service";
import OrderStatusBadge from "@/components/factions/OrderStatusBadge";
import OrderForm from "@/components/factions/OrderForm";

const actions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["ACCEPTED", "REFUSED", "CANCELLED"],
  ACCEPTED: ["IN_PROGRESS", "REFUSED", "CANCELLED"],
  IN_PROGRESS: ["READY", "CANCELLED"],
  READY: ["COMPLETED", "IN_PROGRESS"],
  COMPLETED: [],
  REFUSED: [],
  CANCELLED: [],
};

const labels: Record<OrderStatus, string> = {
  PENDING: "Accepter",
  ACCEPTED: "Prendre en charge",
  IN_PROGRESS: "Marquer comme prête",
  READY: "Marquer comme livrée",
  COMPLETED: "Terminée",
  REFUSED: "Refuser",
  CANCELLED: "Annuler",
};

export default function OwnerFactionsClient() {
  const { user, isLoading } = useAuth();
  const [factions, setFactions] = useState<Faction[]>([]); const [orders, setOrders] = useState<FactionOrder[]>([]); const [selected, setSelected] = useState<FactionId>("domaine-du-chene"); const [open, setOpen] = useState(false); const [config, setConfig] = useState<Faction | null>(null); const [error, setError] = useState("");
  async function load() { const a = await getFactions(); setFactions(a); const target = a.find(x => x.factionId === selected) ?? a[0]; if (target) { setSelected(target.factionId); setConfig(target); } const all = await Promise.all(a.map(x => getFactionOrders(x.factionId))); setOrders(all.flat()); }
  useEffect(() => { if (user?.role === "OWNER") void load().catch(e => setError(e instanceof Error ? e.message : "Impossible de charger les factions.")); }, [user]);
  if (isLoading) return <main className="min-h-screen bg-[#071a11] p-10 text-white">Chargement…</main>;
  if (user?.role !== "OWNER") return <main className="min-h-screen bg-[#071a11] p-10 text-white">Cette page est réservée au propriétaire.</main>;
  async function save() { if (!config) return; const saved = await updateFaction(config.factionId, { leaderRoleId: config.leaderRoleId, memberRoleIds: config.memberRoleIds, orderChannelId: config.orderChannelId }); setFactions(v => v.map(x => x.factionId === saved.factionId ? saved : x)); setConfig(saved); }
  async function act(orderId: string, status: OrderStatus) { try { setError(""); await updateOrderStatus(orderId, status); await load(); } catch (e) { setError(e instanceof Error ? e.message : "Action impossible."); } }
  const faction = factions.find(x => x.factionId === selected); const current = orders.filter(o => o.factionId === selected);
  return <main className="min-h-screen bg-[#071a11] px-6 py-10 text-white"><div className="mx-auto max-w-7xl"><h1 className="text-3xl font-bold text-amber-200">Vue propriétaire — Factions</h1><p className="mt-2 text-emerald-200/80">Vue globale et commandes de clan.</p>
    <div className="mt-8 grid gap-5 md:grid-cols-3">{factions.map(f => <button key={f.factionId} onClick={() => { setSelected(f.factionId); setConfig(f); setOpen(false); }} className={`rounded-2xl border p-5 text-left ${selected === f.factionId ? "border-amber-600 bg-amber-950/20" : "border-emerald-900 bg-[#06150d]"}`}><div className="text-3xl">{f.icon}</div><h2 className="mt-2 font-bold text-amber-200">{f.name}</h2></button>)}</div>
    {error && <p className="mt-4 rounded-lg bg-red-950/50 p-3 text-red-200">{error}</p>}
    {faction && <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_2fr]"><div className="space-y-4"><div className="rounded-2xl border border-emerald-900 bg-[#06150d] p-5"><h2 className="font-bold text-amber-200">Configuration Discord</h2><label className="mt-4 block text-sm">Chef<input value={config?.leaderRoleId ?? ""} onChange={e => setConfig(c => c ? { ...c, leaderRoleId: e.target.value } : c)} className="mt-1 w-full rounded bg-[#071a11] p-2" /></label><label className="mt-3 block text-sm">Rôles membres (un ID par ligne)<textarea value={(config?.memberRoleIds ?? []).join("\n")} onChange={e => setConfig(c => c ? { ...c, memberRoleIds: e.target.value.split(/\s+/).filter(Boolean) } : c)} rows={4} className="mt-1 w-full rounded bg-[#071a11] p-2" /></label><label className="mt-3 block text-sm">Salon des commandes<input value={config?.orderChannelId ?? ""} onChange={e => setConfig(c => c ? { ...c, orderChannelId: e.target.value } : c)} className="mt-1 w-full rounded bg-[#071a11] p-2" /></label><button onClick={() => void save()} className="mt-4 rounded-lg bg-amber-700 px-4 py-2 font-semibold">Enregistrer</button></div><button onClick={() => setOpen(v => !v)} className="w-full rounded-lg bg-emerald-800 px-4 py-3 font-semibold">+ Commande de clan pour {faction.shortName}</button>{open && <OrderForm faction={faction} kind="CLAN" clan onCreated={() => { setOpen(false); void load(); }} />}</div>
      <div><h2 className="text-xl font-bold text-amber-200">Commandes de {faction.shortName}</h2><div className="mt-4 space-y-3">{current.map(o => <div key={o.orderId} className={`rounded-xl border border-emerald-900 bg-[#06150d] p-4 ${o.archivedAt ? "opacity-70" : ""}`}><div className="flex justify-between gap-4"><div><p className="font-semibold">{o.title}</p><p className="text-xs text-emerald-500">{o.orderId}</p></div><OrderStatusBadge status={o.status}/></div><div className="mt-3 flex flex-wrap gap-2">{o.items.map((i,n) => <span key={n} className="rounded bg-emerald-950 px-2 py-1 text-xs">{i.quantity} × {i.name}</span>)}</div>{!o.archivedAt && <div className="mt-4 flex flex-wrap gap-2">{actions[o.status].map(s => <button key={s} onClick={() => void act(o.orderId, s)} className="rounded-lg bg-amber-700 px-3 py-2 text-sm font-semibold">{labels[s]}</button>)}</div>}</div>)}{!current.length && <p className="text-emerald-300">Aucune commande.</p>}</div></div></section>}</div></main>;
}