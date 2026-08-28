"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api/client";
import { getCurrentMember } from "../../../services/members.service";
import { getEconomyHistory } from "../../../services/economy.service";
import type { EconomyTransaction } from "../../../services/economy.service";
import CurrencyIcon from "../../../components/member/economy/CurrencyIcon";

type CurrencyId = "solidus" | "argent" | "bronze";
type EconomyBalances = Record<CurrencyId, number>;

interface EconomyResponse {
  success: boolean;
  data: {
    balances: Partial<EconomyBalances>;
  };
}

const CURRENCIES: Array<{
  id: CurrencyId;
  name: string;
  description: string;
  category: string;
  valueClass: string;
  borderClass: string;
  iconClass: string;
}> = [
  {
    id: "solidus",
    name: "Solidus",
    description: "Monnaie principale du Pacte du Chêne.",
    category: "Monnaie principale",
    valueClass: "text-amber-400",
    borderClass: "border-amber-500/20 hover:border-amber-500/40",
    iconClass: "bg-amber-500/10 text-amber-400",
  },
  {
    id: "argent",
    name: "Argent",
    description: "Monnaie d'argent du Pacte.",
    category: "Monnaie secondaire",
    valueClass: "text-gray-200",
    borderClass: "border-white/10 hover:border-white/20",
    iconClass: "bg-white/10",
  },
  {
    id: "bronze",
    name: "Bronze",
    description: "Monnaie de bronze du Pacte.",
    category: "Monnaie secondaire",
    valueClass: "text-orange-400",
    borderClass: "border-orange-700/20 hover:border-orange-700/40",
    iconClass: "bg-orange-700/10 text-orange-400",
  },
];

const EMPTY_BALANCES: EconomyBalances = {
  solidus: 0,
  argent: 0,
  bronze: 0,
};

function normalizeBalances(
  balances: Partial<EconomyBalances> | undefined
): EconomyBalances {
  return {
    solidus: Number(balances?.solidus ?? 0),
    argent: Number(balances?.argent ?? 0),
    bronze: Number(balances?.bronze ?? 0),
  };
}

function formatAmount(amount: number): string {
  return amount.toLocaleString("fr-FR");
}

function formatSolidus(amount: number): string {
  return amount === 1
    ? "1 Solidus"
    : `${formatAmount(amount)} Solidi`;
}

function formatCurrency(
  currencyId: CurrencyId,
  amount: number
): string {
  return currencyId === "solidus"
    ? formatSolidus(amount)
    : formatAmount(amount);
}

function isSupportedCurrency(
  currencyId: string
): currencyId is CurrencyId {
  return (
    currencyId === "solidus" ||
    currencyId === "argent" ||
    currencyId === "bronze"
  );
}

export default function EconomyPage() {
  const [balances, setBalances] = useState<EconomyBalances>(EMPTY_BALANCES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<EconomyTransaction[]>([]);

  const loadEconomy = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const member = await getCurrentMember();
      const userId = member.profile.id;

      const [economyResponse, historyResponse] = await Promise.all([
        apiFetch<EconomyResponse>(`/economy/${userId}`),
        getEconomyHistory(userId),
      ]);

      setBalances(normalizeBalances(economyResponse.data.balances));
      setHistory(
        historyResponse.filter((transaction) =>
          isSupportedCurrency(transaction.currencyId)
        )
      );
    } catch (err) {
      console.error("Erreur récupération économie :", err);
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de récupérer vos données économiques."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEconomy();
  }, [loadEconomy]);

  const getBalance = (currencyId: CurrencyId) => balances[currencyId];

  if (loading) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#07150f] px-6 py-12 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url("/images/backgrounds/economy-background.png")' }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(180deg,rgba(3,14,9,0.58),rgba(3,14,9,0.68)_45%,rgba(3,14,9,0.84)_100%)]"
        />
        <div className="relative z-10 mx-auto max-w-7xl">
          <header className="mb-10">
            <p className="mb-2 text-sm uppercase tracking-[0.3em] text-amber-500">Le Pacte du Chêne</p>
            <h1 className="text-4xl font-bold">Économie</h1>
            <p className="mt-3 text-gray-300">Consultez vos monnaies et suivez vos transactions économiques.</p>
          </header>
          <div className="rounded-2xl border border-amber-500/30 bg-[#07150f]/95 p-8 text-gray-200 shadow-2xl backdrop-blur-sm">Chargement de votre portefeuille...</div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#07150f] px-6 py-12 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url("/images/backgrounds/economy-background.png")' }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(180deg,rgba(3,14,9,0.58),rgba(3,14,9,0.68)_45%,rgba(3,14,9,0.84)_100%)]"
        />
        <div className="relative z-10 mx-auto max-w-7xl">
          <header className="mb-10">
            <p className="mb-2 text-sm uppercase tracking-[0.3em] text-amber-500">Le Pacte du Chêne</p>
            <h1 className="text-4xl font-bold">Économie</h1>
            <p className="mt-3 text-gray-300">Consultez vos monnaies et suivez vos transactions économiques.</p>
          </header>
          <div className="rounded-2xl border border-red-400/40 bg-red-950/90 p-6 text-red-200 shadow-2xl backdrop-blur-sm">{error}</div>
          <button type="button" onClick={() => void loadEconomy()} className="mt-4 rounded-lg bg-amber-600 px-5 py-3 font-semibold transition hover:bg-amber-500">Réessayer</button>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07150f] px-6 py-12 text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url("/images/backgrounds/economy-background.png")' }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(180deg,rgba(3,14,9,0.58),rgba(3,14,9,0.68)_45%,rgba(3,14,9,0.84)_100%)]"
      />
      <div className="relative z-10 mx-auto max-w-7xl">
        <header className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-sm uppercase tracking-[0.3em] text-amber-500">Le Pacte du Chêne</p>
            <h1 className="text-4xl font-bold">Économie</h1>
            <p className="mt-3 max-w-2xl text-gray-300">Consultez vos monnaies et suivez vos transactions économiques.</p>
          </div>
          <button type="button" onClick={() => void loadEconomy()} className="rounded-lg border border-amber-500/30 bg-[#07150f]/90 px-5 py-3 font-semibold text-gray-100 shadow-lg backdrop-blur-sm transition hover:border-amber-400/60 hover:bg-[#173d2b]/95">↻ Actualiser</button>
        </header>

        <section className="mb-10 rounded-2xl border border-white/10 bg-black/10 p-5 shadow-2xl backdrop-blur-[2px] md:p-6">
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-white drop-shadow-lg">Mon portefeuille</h2>
            <p className="mt-1 text-gray-300">Vos trois monnaies du Pacte.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {CURRENCIES.map((currency) => (
              <article key={currency.id} className={`group rounded-2xl border bg-[#07150f]/92 p-6 shadow-2xl backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:shadow-black/70 ${currency.borderClass}`}>
                <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-white/15 shadow-inner ${currency.iconClass}`}>
                  <CurrencyIcon currencyId={currency.id} size={40} />
                </div>
                <span className="text-sm uppercase tracking-wider text-gray-400">{currency.category}</span>
                <h3 className="mt-1 text-xl font-semibold">{currency.name}</h3>
                <strong className={`mt-4 block text-3xl font-bold ${currency.valueClass}`}>{formatCurrency(currency.id, getBalance(currency.id))}</strong>
                <p className="mt-2 text-sm text-gray-500">{currency.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-amber-500/25 bg-[#07150f]/94 p-6 shadow-2xl backdrop-blur-md">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">Mes monnaies</h2>
              <p className="mt-1 text-sm text-gray-400">Détail de votre portefeuille.</p>
            </div>
            <div className="divide-y divide-white/10">
              {CURRENCIES.map((currency) => (
                <div key={currency.id} className="flex items-center justify-between py-4">
                  <div>
                    <strong className="block">{currency.name}</strong>
                    <span className="text-sm text-gray-500">{currency.category}</span>
                  </div>
                  <strong className={currency.valueClass}>{formatCurrency(currency.id, getBalance(currency.id))}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-amber-500/25 bg-[#07150f]/94 p-6 shadow-2xl backdrop-blur-md">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">Historique</h2>
              <p className="mt-1 text-sm text-gray-400">Suivez vos transactions économiques.</p>
            </div>

            {history.length === 0 ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-amber-500/25 bg-[#07150f]/85 p-6 text-center shadow-inner backdrop-blur-sm">
                <div className="mb-4 opacity-50">
                  <CurrencyIcon currencyId="solidus" size={48} />
                </div>
                <strong className="text-gray-300">Aucune transaction</strong>
                <p className="mt-2 max-w-md text-sm text-gray-500">Les transactions liées aux quêtes, récompenses, achats et échanges apparaîtront ici.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((transaction) => {
                  const currencyId = transaction.currencyId as CurrencyId;
                  const isPositive = transaction.amount >= 0;

                  return (
                    <div key={transaction._id} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/10 p-4">
                      <div>
                        <p className="font-semibold text-white">{transaction.description ?? "Transaction économique"}</p>
                        <p className="mt-1 text-xs text-gray-500">{new Date(transaction.createdAt).toLocaleString("fr-FR")}</p>
                      </div>
                      <div className={`font-bold ${isPositive ? "text-green-400" : "text-red-400"}`}>
                        {isPositive ? "+" : ""}
                        {formatCurrency(currencyId, transaction.amount)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </article>
        </section>
      </div>
    </main>
  );
}
