"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

type Currency = {
  currencyId: string;
  name: string;
  enabled?: boolean;
  icon?: string;
};

type Member = {
  id: string;
  email?: string;
  role?: string;
  profile?: {
    username?: string;
    displayName?: string;
    avatar?: string;
  };
  discord?: {
    username?: string;
    discordId?: string;
  };
  economy?: {
    balances?: Record<string, number> | Map<string, number>;
  };
};

type Rates = {
  argentPerSolidus: number;
  bronzePerArgent: number;
  bronzePerSolidus: number;
};

async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    cache: "no-store",
  });

  const payload = await response
    .json()
    .catch(() => ({}));

  if (!response.ok || payload?.success === false) {
    throw new Error(
      payload?.message ||
        `Erreur serveur (${response.status}).`
    );
  }

  return payload as T;
}

function getBalance(
  member: Member,
  currencyId: string
): number {
  const balances = member.economy?.balances;

  if (!balances) return 0;

  if (balances instanceof Map) {
    return Number(
      balances.get(currencyId) ?? 0
    );
  }

  return Number(
    balances[currencyId] ?? 0
  );
}

function memberName(member: Member) {
  return (
    member.profile?.displayName ||
    member.profile?.username ||
    member.discord?.username ||
    member.email ||
    member.id
  );
}

export default function EconomyAdministrationPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [rates, setRates] = useState<Rates>({
    argentPerSolidus: 100,
    bronzePerArgent: 100,
    bronzePerSolidus: 10000,
  });

  const [selectedIds, setSelectedIds] =
    useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [operation, setOperation] =
    useState<"add" | "remove">("add");
  const [currencyId, setCurrencyId] =
    useState("");
  const [amount, setAmount] = useState("1");
  const [reason, setReason] = useState("");

  const [argentPerSolidus, setArgentPerSolidus] =
    useState("100");
  const [bronzePerArgent, setBronzePerArgent] =
    useState("100");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingRates, setSavingRates] =
    useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        membersResponse,
        currenciesResponse,
        ratesResponse,
      ] = await Promise.all([
        apiRequest<{
          data: Member[];
        }>("/users/admin"),
        apiRequest<{
          data: { currencies: Currency[] };
        }>("/economy/currencies"),
        apiRequest<{
          data: { rates: Rates };
        }>("/economy/exchange-rates"),
      ]);

      const loadedMembers =
        Array.isArray(membersResponse.data)
          ? membersResponse.data
          : [];

      const loadedCurrencies =
        currenciesResponse.data?.currencies ?? [];

      const loadedRates =
        ratesResponse.data?.rates;

      setMembers(loadedMembers);
      setCurrencies(
        loadedCurrencies.filter(
          (currency) => currency.enabled !== false
        )
      );

      if (loadedRates) {
        setRates(loadedRates);
        setArgentPerSolidus(
          String(loadedRates.argentPerSolidus)
        );
        setBronzePerArgent(
          String(loadedRates.bronzePerArgent)
        );
      }

      if (
        !currencyId &&
        loadedCurrencies.length > 0
      ) {
        const preferred =
          loadedCurrencies.find(
            (currency) =>
              currency.currencyId === "solidus"
          ) ?? loadedCurrencies[0];

        setCurrencyId(
          preferred.currencyId
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger l'économie."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredMembers = useMemo(() => {
    const term = search
      .trim()
      .toLowerCase();

    if (!term) return members;

    return members.filter((member) => {
      const values = [
        memberName(member),
        member.profile?.username,
        member.discord?.username,
        member.email,
      ];

      return values.some((value) =>
        value
          ?.toLowerCase()
          .includes(term)
      );
    });
  }, [members, search]);

  const selectedMembers =
    members.filter((member) =>
      selectedIds.includes(member.id)
    );

  const allFilteredSelected =
    filteredMembers.length > 0 &&
    filteredMembers.every((member) =>
      selectedIds.includes(member.id)
    );

  const selectedCurrency =
    currencies.find(
      (currency) =>
        currency.currencyId === currencyId
    );

  function toggleMember(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter(
            (memberId) => memberId !== id
          )
        : [...current, id]
    );
  }

  function toggleFilteredMembers() {
    if (allFilteredSelected) {
      const filteredIds = new Set(
        filteredMembers.map(
          (member) => member.id
        )
      );

      setSelectedIds((current) =>
        current.filter(
          (id) => !filteredIds.has(id)
        )
      );

      return;
    }

    setSelectedIds((current) => [
      ...new Set([
        ...current,
        ...filteredMembers.map(
          (member) => member.id
        ),
      ]),
    ]);
  }

  async function submitAdjustment(
    event: FormEvent
  ) {
    event.preventDefault();

    if (selectedIds.length === 0) {
      setError(
        "Sélectionnez au moins un membre."
      );
      return;
    }

    const numericAmount = Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      setError(
        "Le montant doit être supérieur à 0."
      );
      return;
    }

    if (reason.trim().length < 3) {
      setError(
        "Une justification d'au moins 3 caractères est obligatoire."
      );
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setMessage("");

      const response =
        await apiRequest<{
          data: {
            affectedCount: number;
          };
        }>("/economy/admin/adjust", {
          method: "POST",
          body: JSON.stringify({
            userIds: selectedIds,
            currencyId,
            amount: numericAmount,
            operation,
            reason: reason.trim(),
          }),
        });

      setMessage(
        `${operation === "add" ? "Crédit" : "Retrait"} effectué sur ${response.data.affectedCount} membre(s).`
      );

      await loadData();
      setReason("");
      setSelectedIds([]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de modifier les soldes."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function saveRates(
    event: FormEvent
  ) {
    event.preventDefault();

    const argent = Number(
      argentPerSolidus
    );
    const bronze = Number(
      bronzePerArgent
    );

    if (
      !Number.isFinite(argent) ||
      argent <= 0 ||
      !Number.isFinite(bronze) ||
      bronze <= 0
    ) {
      setError(
        "Les taux doivent être des nombres supérieurs à 0."
      );
      return;
    }

    try {
      setSavingRates(true);
      setError("");
      setMessage("");

      const response =
        await apiRequest<{
          data: { rates: Rates };
        }>(
          "/economy/admin/exchange-rates",
          {
            method: "PUT",
            body: JSON.stringify({
              argentPerSolidus: argent,
              bronzePerArgent: bronze,
            }),
          }
        );

      setRates(response.data.rates);
      setMessage(
        "Les valeurs de conversion ont été mises à jour."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de modifier les taux."
      );
    } finally {
      setSavingRates(false);
    }
  }

  return (
    <main className="min-h-screen bg-green-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-amber-400">
            Administration
          </p>

          <h1 className="text-4xl font-bold">
            Gestion de l'économie
          </h1>

          <p className="mt-2 max-w-3xl text-green-200">
            Gérez les soldes des membres, distribuez ou
            retirez des monnaies et contrôlez les valeurs
            de conversion du système économique.
          </p>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-700 bg-red-950/40 p-4 text-red-200">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 rounded-xl border border-green-600 bg-green-900/60 p-4 text-green-100">
            {message}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(340px,0.8fr)]">
          <section className="rounded-2xl border border-green-800 bg-green-900/60 p-6">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
                Opération
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                Modifier les soldes
              </h2>

              <p className="mt-2 text-sm text-green-200">
                Une opération peut être appliquée à un
                ou plusieurs membres simultanément.
              </p>
            </div>

            <form
              onSubmit={submitAdjustment}
              className="space-y-6"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() =>
                    setOperation("add")
                  }
                  className={`rounded-xl border p-4 text-left transition ${
                    operation === "add"
                      ? "border-amber-400 bg-amber-950/40"
                      : "border-green-700 bg-green-950/40 hover:border-green-500"
                  }`}
                >
                  <span className="block text-lg font-bold">
                    Donner
                  </span>
                  <span className="text-sm text-green-200">
                    Créditer les membres sélectionnés
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setOperation("remove")
                  }
                  className={`rounded-xl border p-4 text-left transition ${
                    operation === "remove"
                      ? "border-amber-400 bg-amber-950/40"
                      : "border-green-700 bg-green-950/40 hover:border-green-500"
                  }`}
                >
                  <span className="block text-lg font-bold">
                    Retirer
                  </span>
                  <span className="text-sm text-green-200">
                    Débiter les membres sélectionnés
                  </span>
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">
                    Monnaie
                  </span>

                  <select
                    value={currencyId}
                    onChange={(event) =>
                      setCurrencyId(
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-green-700 bg-green-950 px-4 py-3 text-white outline-none focus:border-amber-400"
                  >
                    {currencies.map(
                      (currency) => (
                        <option
                          key={
                            currency.currencyId
                          }
                          value={
                            currency.currencyId
                          }
                        >
                          {currency.name} (
                          {
                            currency.currencyId
                          }
                          )
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">
                    Montant par membre
                  </span>

                  <input
                    type="number"
                    min="0.000001"
                    step="any"
                    value={amount}
                    onChange={(event) =>
                      setAmount(
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-green-700 bg-green-950 px-4 py-3 text-white outline-none focus:border-amber-400"
                  />
                </label>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between gap-4">
                  <div>
                    <span className="block text-sm font-semibold">
                      Membres
                    </span>
                    <span className="text-sm text-green-300">
                      {selectedIds.length} sélectionné(s)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={
                      toggleFilteredMembers
                    }
                    className="rounded-lg border border-green-600 px-3 py-2 text-sm font-semibold hover:bg-green-800"
                  >
                    {allFilteredSelected
                      ? "Désélectionner tout"
                      : "Sélectionner tout"}
                  </button>
                </div>

                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Rechercher un membre..."
                  className="mb-3 w-full rounded-lg border border-green-700 bg-green-950 px-4 py-3 text-white outline-none focus:border-amber-400"
                />

                <div className="max-h-80 overflow-y-auto rounded-xl border border-green-800 bg-green-950/60">
                  {loading ? (
                    <p className="p-6 text-center text-green-300">
                      Chargement des membres...
                    </p>
                  ) : filteredMembers.length ===
                    0 ? (
                    <p className="p-6 text-center text-green-300">
                      Aucun membre trouvé.
                    </p>
                  ) : (
                    filteredMembers.map(
                      (member) => {
                        const checked =
                          selectedIds.includes(
                            member.id
                          );

                        return (
                          <label
                            key={member.id}
                            className={`flex cursor-pointer items-center gap-4 border-b border-green-900 p-4 last:border-0 hover:bg-green-900/70 ${
                              checked
                                ? "bg-green-900"
                                : ""
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                toggleMember(
                                  member.id
                                )
                              }
                              className="h-5 w-5 accent-amber-500"
                            />

                            <div className="min-w-0 flex-1">
                              <p className="truncate font-semibold">
                                {memberName(
                                  member
                                )}
                              </p>

                              <p className="truncate text-sm text-green-300">
                                {member.profile
                                  ?.username ||
                                  member.discord
                                    ?.username ||
                                  member.email ||
                                  member.id}
                              </p>
                            </div>

                            {currencyId && (
                              <span className="text-sm text-amber-300">
                                {getBalance(
                                  member,
                                  currencyId
                                ).toLocaleString(
                                  "fr-FR"
                                )}
                              </span>
                            )}
                          </label>
                        );
                      }
                    )
                  )}
                </div>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold">
                  Justification
                </span>

                <textarea
                  value={reason}
                  onChange={(event) =>
                    setReason(
                      event.target.value
                    )
                  }
                  maxLength={500}
                  rows={4}
                  placeholder="Expliquez pourquoi cette opération est effectuée..."
                  className="w-full rounded-lg border border-green-700 bg-green-950 px-4 py-3 text-white outline-none focus:border-amber-400"
                />

                <span className="mt-1 block text-right text-xs text-green-400">
                  {reason.length}/500
                </span>
              </label>

              <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
                <p className="text-sm text-amber-100">
                  {operation === "add"
                    ? "Vous allez créditer"
                    : "Vous allez retirer"}{" "}
                  <strong>
                    {amount || "0"}{" "}
                    {selectedCurrency?.name ??
                      currencyId}
                  </strong>{" "}
                  à{" "}
                  <strong>
                    {selectedIds.length}
                  </strong>{" "}
                  membre(s).
                </p>
              </div>

              <button
                type="submit"
                disabled={
                  submitting ||
                  loading ||
                  currencies.length === 0
                }
                className={`w-full rounded-xl px-5 py-4 font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  operation === "add"
                    ? "bg-amber-600 hover:bg-amber-500"
                    : "bg-red-700 hover:bg-red-600"
                }`}
              >
                {submitting
                  ? "Traitement..."
                  : operation === "add"
                    ? "Donner la monnaie"
                    : "Retirer la monnaie"}
              </button>
            </form>
          </section>

          <div className="space-y-8">
            <section className="rounded-2xl border border-green-800 bg-green-900/60 p-6">
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
                  Système monétaire
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  Valeur des monnaies
                </h2>

                <p className="mt-2 text-sm text-green-200">
                  Ces valeurs sont utilisées comme référence
                  pour les conversions du Pacte.
                </p>
              </div>

              <form
                onSubmit={saveRates}
                className="space-y-5"
              >
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">
                    1 Solidus =
                  </span>

                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0.000001"
                      step="any"
                      value={
                        argentPerSolidus
                      }
                      onChange={(event) =>
                        setArgentPerSolidus(
                          event.target.value
                        )
                      }
                      className="min-w-0 flex-1 rounded-lg border border-green-700 bg-green-950 px-4 py-3 text-white outline-none focus:border-amber-400"
                    />

                    <span className="w-20 text-sm text-green-200">
                      Argent
                    </span>
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">
                    1 Argent =
                  </span>

                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0.000001"
                      step="any"
                      value={
                        bronzePerArgent
                      }
                      onChange={(event) =>
                        setBronzePerArgent(
                          event.target.value
                        )
                      }
                      className="min-w-0 flex-1 rounded-lg border border-green-700 bg-green-950 px-4 py-3 text-white outline-none focus:border-amber-400"
                    />

                    <span className="w-20 text-sm text-green-200">
                      Bronze
                    </span>
                  </div>
                </label>

                <div className="rounded-xl border border-green-700 bg-green-950/60 p-4">
                  <p className="text-sm text-green-300">
                    Valeur calculée
                  </p>

                  <p className="mt-1 text-xl font-bold text-amber-300">
                    1 Solidus ={" "}
                    {(
                      Number(
                        argentPerSolidus
                      ) *
                      Number(
                        bronzePerArgent
                      )
                    ).toLocaleString(
                      "fr-FR"
                    )}{" "}
                    Bronze
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={savingRates}
                  className="w-full rounded-xl bg-amber-600 px-5 py-3 font-bold hover:bg-amber-500 disabled:opacity-50"
                >
                  {savingRates
                    ? "Enregistrement..."
                    : "Enregistrer les valeurs"}
                </button>
              </form>
            </section>

            <section className="rounded-2xl border border-green-800 bg-green-900/60 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
                Référence actuelle
              </p>

              <div className="mt-4 space-y-3">
                <div className="flex justify-between gap-4 rounded-lg bg-green-950/60 p-3">
                  <span>1 Solidus</span>
                  <strong className="text-amber-300">
                    {rates.argentPerSolidus} Argent
                  </strong>
                </div>

                <div className="flex justify-between gap-4 rounded-lg bg-green-950/60 p-3">
                  <span>1 Argent</span>
                  <strong className="text-amber-300">
                    {rates.bronzePerArgent} Bronze
                  </strong>
                </div>

                <div className="flex justify-between gap-4 rounded-lg bg-green-950/60 p-3">
                  <span>1 Solidus</span>
                  <strong className="text-amber-300">
                    {rates.bronzePerSolidus} Bronze
                  </strong>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-green-800 bg-green-900/60 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
                Sélection
              </p>

              <p className="mt-2 text-3xl font-bold">
                {selectedMembers.length}
              </p>

              <p className="text-green-300">
                membre(s) actuellement sélectionné(s)
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
