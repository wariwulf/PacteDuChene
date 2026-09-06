"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import CurrencyIcon from "@/components/member/economy/CurrencyIcon";
import { getCurrentMember } from "@/services/members.service";
import { getEconomyHistory } from "@/services/economy.service";
import { apiFetch } from "@/lib/api/client";
import { getInventory, InventoryItem } from "@/services/shops.service";

type Currency = "solidus" | "argent" | "bronze";
type Balances = Record<Currency, number>;

const currencies: Array<[Currency, string]> = [
  ["solidus", "Solidus"],
  ["argent", "Argent"],
  ["bronze", "Bronze"],
];

export default function InventairePage() {
  const [b, setB] = useState<Balances>({
    solidus: 0,
    argent: 0,
    bronze: 0,
  });
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [rates, setRates] = useState<any>(null);
  const [from, setFrom] = useState<Currency>("bronze");
  const [to, setTo] = useState<Currency>("argent");
  const [amount, setAmount] = useState("100");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const m = await getCurrentMember();
      const id = m.profile.id;

      const [e, h, i, r] = await Promise.all([
        apiFetch<any>(`/economy/${id}`),
        getEconomyHistory(id),
        getInventory(),
        apiFetch<any>("/economy/exchange-rates"),
      ]);

      setB({
        solidus: Number(e.data.balances.solidus ?? 0),
        argent: Number(e.data.balances.argent ?? 0),
        bronze: Number(e.data.balances.bronze ?? 0),
      });
      setHistory(h);
      setItems(i);
      setRates(r.data.rates);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Impossible de charger l'inventaire."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function exchange() {
    try {
      setBusy(true);
      setError("");

      await apiFetch("/economy/exchange", {
        method: "POST",
        body: JSON.stringify({
          from,
          to,
          amount: Number(amount),
        }),
      });

      await load();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Impossible d'effectuer le change."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07150f] px-4 py-8 text-white sm:px-6 sm:py-12">
      {/* Fond immersif */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            'url("/images/backgrounds/economy-background.png")',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(180deg,rgba(3,14,9,0.38),rgba(3,14,9,0.60)_45%,rgba(3,14,9,0.82)_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-40 bg-[radial-gradient(circle_at_top,rgba(180,130,45,0.12),transparent_42%)]"
      />

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* En-tête */}
        <header className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-amber-500">
              Le Pacte du Chêne
            </p>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Inventaire
            </h1>

            <p className="mt-3 max-w-2xl text-gray-300">
              Vos richesses, vos possessions et vos échanges.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="h-fit rounded-lg border border-white/10 bg-[rgba(6,32,21,0.95)] px-5 py-3 font-semibold shadow-lg transition hover:border-amber-500/30 hover:bg-[#08281b] disabled:cursor-wait disabled:opacity-60"
          >
            ↻ {loading ? "Actualisation..." : "Actualiser"}
          </button>
        </header>

        {error && (
          <div className="mb-8 rounded-xl border border-red-500/30 bg-red-950/85 p-4 text-red-200 shadow-xl">
            {error}
          </div>
        )}

        {/* Portefeuille */}
        <section className="mb-10">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-500">
              Vos richesses
            </p>
            <h2 className="mt-1 text-2xl font-bold">Mon portefeuille</h2>
            <p className="mt-1 text-sm text-gray-400">
              Les trois monnaies qui circulent au sein du Pacte.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {currencies.map(([id, name]) => {
              const currencyClasses: Record<
                Currency,
                { border: string; icon: string; value: string }
              > = {
                solidus: {
                  border: "border-amber-500/30 hover:border-amber-500/50",
                  icon: "bg-amber-500/10 text-amber-400",
                  value: "text-amber-400",
                },
                argent: {
                  border: "border-slate-300/20 hover:border-slate-200/35",
                  icon: "bg-white/10 text-slate-200",
                  value: "text-slate-100",
                },
                bronze: {
                  border: "border-orange-700/30 hover:border-orange-600/50",
                  icon: "bg-orange-700/10 text-orange-400",
                  value: "text-orange-400",
                },
              };

              const styles = currencyClasses[id];

              return (
                <article
                  key={id}
                  className={`group relative overflow-hidden rounded-xl border p-6 shadow-xl transition duration-200 hover:-translate-y-0.5 ${styles.border}`}
                  style={{ backgroundColor: "rgba(6, 32, 21, 0.96)" }}
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  />

                  <div
                    className={`mb-5 flex h-12 w-12 items-center justify-center rounded-lg ${styles.icon}`}
                  >
                    <CurrencyIcon currencyId={id} />
                  </div>

                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                    Monnaie
                  </p>

                  <h3 className="mt-1 text-xl font-semibold">{name}</h3>

                  <strong
                    className={`mt-4 block text-3xl font-bold ${styles.value}`}
                  >
                    {b[id].toLocaleString("fr-FR")}
                  </strong>
                </article>
              );
            })}
          </div>
        </section>

        {/* Bureau du change */}
        <section className="mb-10 overflow-hidden rounded-xl border border-amber-500/25 shadow-xl"
          style={{ backgroundColor: "rgba(6, 32, 21, 0.96)" }}>
          <div className="border-b border-white/10 px-6 py-5 sm:px-7">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-500">
              Échanges
            </p>
            <h2 className="mt-1 text-xl font-bold">Bureau du change</h2>
            <p className="mt-1 text-sm text-gray-400">
              Les taux établis par le Pacte s'appliquent automatiquement.
            </p>

            {rates && (
              <div className="mt-4 inline-flex flex-wrap gap-x-4 gap-y-1 rounded-lg border border-amber-500/15 bg-amber-500/5 px-4 py-2 text-sm text-amber-200">
                <span>
                  1 Solidus = {rates.argentPerSolidus} Argent
                </span>
                <span className="text-amber-500/40">•</span>
                <span>
                  1 Argent = {rates.bronzePerArgent} Bronze
                </span>
              </div>
            )}
          </div>

          <div className="p-6 sm:p-7">
            <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr_auto] md:items-end">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Monnaie de départ
                </span>
                <select
                  value={from}
                  onChange={(e) => setFrom(e.target.value as Currency)}
                  className="w-full rounded-lg border border-white/10 bg-green-950 px-4 py-3 text-white outline-none transition focus:border-amber-500/60"
                >
                  <option value="bronze">Bronze</option>
                  <option value="argent">Argent</option>
                  <option value="solidus">Solidus</option>
                </select>
              </label>

              <div className="hidden pb-3 text-center text-xl text-amber-500/60 md:block">
                →
              </div>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Monnaie reçue
                </span>
                <select
                  value={to}
                  onChange={(e) => setTo(e.target.value as Currency)}
                  className="w-full rounded-lg border border-white/10 bg-green-950 px-4 py-3 text-white outline-none transition focus:border-amber-500/60"
                >
                  <option value="bronze">Bronze</option>
                  <option value="argent">Argent</option>
                  <option value="solidus">Solidus</option>
                </select>
              </label>

              <label className="block md:col-start-1 md:col-end-4">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Quantité
                </span>
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-green-950 px-4 py-3 text-white outline-none transition focus:border-amber-500/60"
                />
              </label>

              <button
                type="button"
                onClick={() => void exchange()}
                disabled={busy || from === to}
                className="rounded-lg border border-amber-400/20 bg-amber-600 px-5 py-3 font-semibold text-white shadow-lg transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-40 md:col-start-4"
              >
                {busy ? "Change..." : "Faire le change"}
              </button>
            </div>
          </div>
        </section>

        {/* Possessions */}
        <section className="mb-10 overflow-hidden rounded-xl border border-white/10 shadow-xl"
          style={{ backgroundColor: "rgba(6, 32, 21, 0.96)" }}>
          <div className="border-b border-white/10 px-6 py-5 sm:px-7">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-500">
              Biens du Pacte
            </p>
            <h2 className="mt-1 text-xl font-bold">Mes possessions</h2>
            <p className="mt-1 text-sm text-gray-400">
              Les objets qui vous appartiennent et leur provenance.
            </p>
          </div>

          {items.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center px-6 py-12 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-green-950/70 text-2xl">
                ⚒
              </div>
              <strong className="text-gray-300">
                Votre inventaire est encore vide.
              </strong>
              <p className="mt-2 max-w-md text-sm text-gray-500">
                Les objets acquis dans les boutiques du Pacte apparaîtront
                ici.
              </p>
              <Link
                href="/boutiques"
                className="mt-5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2 text-sm font-semibold text-amber-300 transition hover:bg-amber-500/10 hover:text-amber-200"
              >
                Découvrir les boutiques
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="bg-[rgba(0,0,0,0.22)]">
                  <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-gray-500">
                    <th className="px-5 py-4 sm:px-6">Objet</th>
                    <th className="px-5 py-4 sm:px-6">Boutique</th>
                    <th className="px-5 py-4 text-center sm:px-6">
                      Quantité
                    </th>
                    <th className="px-5 py-4 sm:px-6">Acquis le</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((i) => (
                    <tr
                      key={i.itemId}
                      className="border-b border-white/5 transition hover:bg-[rgba(255,255,255,0.025)]"
                    >
                      <td className="px-5 py-4 sm:px-6">
                        <span className="font-semibold text-white">
                          {i.name}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-gray-400 sm:px-6">
                        {i.shopId}
                      </td>

                      <td className="px-5 py-4 text-center sm:px-6">
                        <span className="inline-flex min-w-9 items-center justify-center rounded-full border border-amber-500/20 bg-amber-500/5 px-2.5 py-1 font-semibold text-amber-300">
                          {i.quantity}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-gray-400 sm:px-6">
                        {new Date(i.acquiredAt).toLocaleDateString("fr-FR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Historique */}
        <section className="overflow-hidden rounded-xl border border-white/10 shadow-xl"
        style={{ backgroundColor: "rgba(6, 32, 21, 0.96)" }}>
          <div className="border-b border-white/10 px-6 py-5 sm:px-7">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-500">
              Registre
            </p>
            <h2 className="mt-1 text-xl font-bold">Historique économique</h2>
            <p className="mt-1 text-sm text-gray-400">
              Les mouvements de vos monnaies sont conservés dans le registre
              du Pacte.
            </p>
          </div>

          {history.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-500">
              Aucune transaction enregistrée.
            </div>
          ) : (
            <div className="space-y-3 p-5 sm:p-6">
              {history.slice(0, 30).map((t) => (
                <div
                  key={t._id}
                  className="flex flex-col justify-between gap-3 rounded-lg border border-white/10 bg-[rgba(0,0,0,0.18)] p-4 transition hover:border-white/15 hover:bg-[rgba(255,255,255,0.025)] sm:flex-row sm:items-center"
                >
                  <div>
                    <span className="font-semibold text-gray-200">
                      {t.description || "Transaction"}
                    </span>
                    <p className="mt-1 text-xs text-gray-500">
                      {new Date(t.createdAt).toLocaleString("fr-FR")}
                    </p>
                  </div>

                  <strong
                    className={
                      t.amount >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }
                  >
                    {t.amount >= 0 ? "+" : ""}
                    {t.amount} {t.currencyId}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="mt-7 text-center">
          <Link
            href="/boutiques"
            className="text-sm font-semibold text-amber-300 transition hover:text-white"
          >
            Découvrir les boutiques →
          </Link>
        </div>
      </div>
    </main>
  );
}
