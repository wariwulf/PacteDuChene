"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface Balances {
  [currencyId: string]: number;
}

interface EconomyResponse {
  success: boolean;
  data?: {
    balances?: Balances;
  };
  message?: string;
}

interface Transaction {
  _id?: string;
  id?: string;
  userId?: string;
  currencyId?: string;
  amount?: number;
  type?: string;
  source?: string;
  sourceId?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface HistoryResponse {
  success: boolean;
  data?: Transaction[];
  message?: string;
}

const currencyNames: Record<string, string> = {
  solidus: "Solidus",
  credits: "Crédits",
  honor: "Honneur",
  resources: "Ressources",
};

const transactionTypes: Record<string, string> = {
  quest_reward: "Récompense de quête",
  achievement_reward: "Récompense de succès",
  purchase: "Achat",
  admin_add: "Ajout administrateur",
  admin_remove: "Retrait administrateur",
  exchange: "Échange",
  other: "Autre",
};

function getCurrencyName(currencyId: string) {
  return (
    currencyNames[currencyId] ||
    currencyId.charAt(0).toUpperCase() + currencyId.slice(1)
  );
}

function getTransactionType(type?: string) {
  if (!type) return "Transaction";

  return transactionTypes[type] || type;
}

function formatDate(date?: string) {
  if (!date) return "Date inconnue";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Date inconnue";
  }

  return parsed.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EconomieMembrePage() {
  const params = useParams();

  const id =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
        ? params.id[0]
        : "";

  const [balances, setBalances] = useState<Balances>({});
  const [history, setHistory] = useState<Transaction[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [error, setError] = useState("");
  const [historyError, setHistoryError] = useState("");

  const [currencyId, setCurrencyId] = useState("solidus");
  const [amount, setAmount] = useState("");

  const [operationLoading, setOperationLoading] = useState(false);
  const [operationMessage, setOperationMessage] = useState("");
  const [operationError, setOperationError] = useState("");

  const loadBalances = useCallback(async () => {
    if (!id) {
      setError("Identifiant du membre introuvable.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/economy/${encodeURIComponent(id)}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const payload: EconomyResponse = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(
          payload.message ||
            `Impossible de récupérer l'économie (${response.status}).`
        );
      }

      setBalances(payload.data?.balances || {});
    } catch (err) {
      console.error("Erreur récupération économie :", err);

      setError(
        err instanceof Error
          ? err.message
          : "Impossible de récupérer les informations économiques."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadHistory = useCallback(async () => {
    if (!id) {
      setHistoryError("Identifiant du membre introuvable.");
      setLoadingHistory(false);
      return;
    }

    try {
      setLoadingHistory(true);
      setHistoryError("");

      const response = await fetch(
        `${API_URL}/economy/${encodeURIComponent(id)}/history`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const payload: HistoryResponse = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(
          payload.message ||
            `Impossible de récupérer l'historique (${response.status}).`
        );
      }

      setHistory(Array.isArray(payload.data) ? payload.data : []);
    } catch (err) {
      console.error("Erreur historique économie :", err);

      setHistoryError(
        err instanceof Error
          ? err.message
          : "Impossible de récupérer l'historique."
      );
    } finally {
      setLoadingHistory(false);
    }
  }, [id]);

  useEffect(() => {
    loadBalances();
    loadHistory();
  }, [loadBalances, loadHistory]);

  async function performOperation(operation: "add" | "remove") {
    setOperationMessage("");
    setOperationError("");

    const numericAmount = Number(amount);

    if (!currencyId.trim()) {
      setOperationError("Veuillez sélectionner une monnaie.");
      return;
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setOperationError("Le montant doit être supérieur à 0.");
      return;
    }

    try {
      setOperationLoading(true);

      const response = await fetch(
        `${API_URL}/economy/${encodeURIComponent(id)}/${operation}`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currencyId,
            amount: numericAmount,
          }),
        }
      );

      const payload: EconomyResponse = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(
          payload.message ||
            `Erreur lors de l'opération (${response.status}).`
        );
      }

      setBalances(payload.data?.balances || {});
      setAmount("");

      setOperationMessage(
        operation === "add"
          ? `${numericAmount} ${getCurrencyName(
              currencyId
            )} ajouté(s) avec succès.`
          : `${numericAmount} ${getCurrencyName(
              currencyId
            )} retiré(s) avec succès.`
      );

      await loadHistory();
    } catch (err) {
      console.error("Erreur opération économie :", err);

      setOperationError(
        err instanceof Error
          ? err.message
          : "Impossible d'effectuer l'opération."
      );
    } finally {
      setOperationLoading(false);
    }
  }

  async function refresh() {
    setOperationMessage("");
    setOperationError("");

    await Promise.all([loadBalances(), loadHistory()]);
  }

  const balanceEntries = Object.entries(balances);

  return (
    <main className="min-h-screen bg-green-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        {/* EN-TÊTE */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-500">
              Le Pacte du Chêne
            </p>

            <h1 className="mt-2 text-4xl font-bold text-white">
              Économie
            </h1>

            <p className="mt-2 text-green-300">
              Consultez et gérez les monnaies de ce membre.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href={`/membres/${id}`}
              className="rounded-lg border border-green-700 bg-green-900 px-5 py-3 font-semibold text-green-100 transition hover:bg-green-800"
            >
              ← Retour au membre
            </Link>

            <button
              type="button"
              onClick={refresh}
              disabled={loading || loadingHistory}
              className="rounded-lg bg-amber-600 px-5 py-3 font-semibold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Actualiser
            </button>
          </div>
        </div>

        {/* ERREUR SOLDE */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-700 bg-red-950/40 p-5 text-red-300">
            <p className="font-semibold">
              Impossible de charger l'économie
            </p>

            <p className="mt-1 text-sm">{error}</p>

            <button
              type="button"
              onClick={loadBalances}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-500"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* SOLDES */}
        <section className="mb-8 rounded-xl border border-green-800 bg-green-900/40 p-6">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-500">
              Trésor du membre
            </p>

            <h2 className="mt-1 text-2xl font-bold text-green-100">
              Soldes
            </h2>
          </div>

          {loading ? (
            <div className="rounded-lg border border-green-800 bg-green-950/50 p-6 text-green-300">
              Chargement des soldes...
            </div>
          ) : balanceEntries.length === 0 ? (
            <div className="rounded-lg border border-green-800 bg-green-950/50 p-6 text-green-300">
              Aucun solde enregistré pour ce membre.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {balanceEntries.map(([id, value]) => (
                <div
                  key={id}
                  className="rounded-xl border border-green-700 bg-green-950/60 p-5"
                >
                  <p className="text-sm font-semibold uppercase tracking-wider text-green-400">
                    {getCurrencyName(id)}
                  </p>

                  <p className="mt-3 text-3xl font-bold text-amber-400">
                    {value.toLocaleString("fr-FR")}
                  </p>

                  <p className="mt-1 text-xs text-green-500">
                    {id}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* GESTION */}
        <section className="mb-8 rounded-xl border border-green-800 bg-green-900/40 p-6">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-500">
              Administration
            </p>

            <h2 className="mt-1 text-2xl font-bold text-green-100">
              Gérer le solde
            </h2>

            <p className="mt-2 text-sm text-green-400">
              Ces opérations permettent d'ajouter ou de retirer manuellement
              une monnaie au membre.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label
                htmlFor="currencyId"
                className="mb-2 block text-sm font-semibold text-green-300"
              >
                Monnaie
              </label>

              <input
                id="currencyId"
                type="text"
                value={currencyId}
                onChange={(event) => setCurrencyId(event.target.value)}
                placeholder="solidus"
                className="w-full rounded-lg border border-green-700 bg-green-950 px-4 py-3 text-white outline-none placeholder:text-green-700 focus:border-amber-500"
              />
            </div>

            <div>
              <label
                htmlFor="amount"
                className="mb-2 block text-sm font-semibold text-green-300"
              >
                Montant
              </label>

              <input
                id="amount"
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="25"
                className="w-full rounded-lg border border-green-700 bg-green-950 px-4 py-3 text-white outline-none placeholder:text-green-700 focus:border-amber-500"
              />
            </div>

            <div className="flex items-end gap-3">
              <button
                type="button"
                onClick={() => performOperation("add")}
                disabled={operationLoading}
                className="flex-1 rounded-lg bg-amber-600 px-4 py-3 font-bold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {operationLoading ? "..." : "+ Ajouter"}
              </button>

              <button
                type="button"
                onClick={() => performOperation("remove")}
                disabled={operationLoading}
                className="flex-1 rounded-lg bg-red-700 px-4 py-3 font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {operationLoading ? "..." : "− Retirer"}
              </button>
            </div>
          </div>

          {operationMessage && (
            <div className="mt-5 rounded-lg border border-green-700 bg-green-950/50 p-4 text-sm font-semibold text-green-300">
              ✓ {operationMessage}
            </div>
          )}

          {operationError && (
            <div className="mt-5 rounded-lg border border-red-700 bg-red-950/40 p-4 text-sm font-semibold text-red-300">
              {operationError}
            </div>
          )}
        </section>

        {/* HISTORIQUE */}
        <section className="rounded-xl border border-green-800 bg-green-900/40 p-6">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-500">
              Journal
            </p>

            <h2 className="mt-1 text-2xl font-bold text-green-100">
              Historique des transactions
            </h2>
          </div>

          {loadingHistory ? (
            <div className="rounded-lg border border-green-800 bg-green-950/50 p-6 text-green-300">
              Chargement de l'historique...
            </div>
          ) : historyError ? (
            <div className="rounded-lg border border-red-700 bg-red-950/40 p-5 text-red-300">
              <p className="font-semibold">{historyError}</p>

              <button
                type="button"
                onClick={loadHistory}
                className="mt-4 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-500"
              >
                Réessayer
              </button>
            </div>
          ) : history.length === 0 ? (
            <div className="rounded-lg border border-green-800 bg-green-950/50 p-6 text-green-300">
              Aucune transaction enregistrée.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse">
                <thead>
                  <tr className="border-b border-green-800 text-left text-xs uppercase tracking-wider text-green-500">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Monnaie</th>
                    <th className="px-4 py-3">Montant</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Description</th>
                  </tr>
                </thead>

                <tbody>
                  {history.map((transaction, index) => {
                    const positive =
                      typeof transaction.amount === "number"
                        ? transaction.amount >= 0
                        : true;

                    return (
                      <tr
                        key={
                          transaction._id ||
                          transaction.id ||
                          `${transaction.createdAt}-${index}`
                        }
                        className="border-b border-green-900 transition hover:bg-green-950/50"
                      >
                        <td className="px-4 py-4 text-sm text-green-300">
                          {formatDate(transaction.createdAt)}
                        </td>

                        <td className="px-4 py-4 font-semibold text-green-100">
                          {getCurrencyName(
                            transaction.currencyId || "inconnue"
                          )}
                        </td>

                        <td
                          className={`px-4 py-4 font-bold ${
                            positive
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {positive ? "+" : ""}
                          {typeof transaction.amount === "number"
                            ? transaction.amount.toLocaleString("fr-FR")
                            : "0"}
                        </td>

                        <td className="px-4 py-4 text-sm text-green-300">
                          {getTransactionType(transaction.type)}
                        </td>

                        <td className="px-4 py-4 text-sm text-green-400">
                          {transaction.description ||
                            transaction.source ||
                            "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}