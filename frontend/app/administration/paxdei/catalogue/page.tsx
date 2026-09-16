"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addPaxDeiFactionCatalogItem,
  excludePaxDeiFactionCatalogItem,
  getPaxDeiFactionCatalog,
  reinstatePaxDeiFactionCatalogItem,
  removePaxDeiFactionCatalogItem,
  searchPaxDeiItems,
  type PaxDeiCatalogEntry,
  type PaxDeiFactionId,
  type PaxDeiItem,
} from "@/services/paxdei.service";

const FACTIONS: Array<{
  id: PaxDeiFactionId;
  name: string;
  icon: string;
  description: string;
}> = [
  {
    id: "domaine-du-chene",
    name: "Domaine du Chêne",
    icon: "🌳",
    description: "Ressources, récolte et approvisionnement.",
  },
  {
    id: "guilde-des-artisans",
    name: "Guilde des Artisans",
    icon: "⚒️",
    description: "Objets fabriqués et résultats de recettes.",
  },
  {
    id: "confrerie-de-lepee",
    name: "Confrérie de l'Épée",
    icon: "⚔️",
    description: "Butin, reliques et objets récupérés.",
  },
];

function reasonLabel(reason: PaxDeiCatalogEntry["reason"]) {
  switch (reason) {
    case "RESOURCE_DROP": return "Automatique · ressource";
    case "RECIPE_RESULT": return "Automatique · recette";
    case "FACTION_RELIC": return "Automatique · relique";
    case "MANUAL": return "Manuel";
    case "MANUAL_EXCLUSION": return "🚫 Exclusion manuelle";
  }
}

export default function PaxDeiCatalogAdminPage() {
  const [factionId, setFactionId] = useState<PaxDeiFactionId>("domaine-du-chene");
  const [catalog, setCatalog] = useState<PaxDeiCatalogEntry[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PaxDeiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchMode, setSearchMode] = useState<"ALL" | "UNAFFILIATED">("ALL");
  const [allCatalogIds, setAllCatalogIds] = useState<Set<string>>(new Set());
  const [factionMenuOpen, setFactionMenuOpen] = useState(false);
  const [busyItemId, setBusyItemId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadCatalog() {
    try {
      setLoading(true);
      setError("");

      const [currentCatalog, ...otherCatalogs] = await Promise.all([
        getPaxDeiFactionCatalog(factionId),
        ...FACTIONS
          .filter((faction) => faction.id !== factionId)
          .map((faction) => getPaxDeiFactionCatalog(faction.id)),
      ]);

      setCatalog(currentCatalog);

      const ids = new Set<string>();
      for (const entry of currentCatalog) {
        if (
          entry.reason !== "MANUAL_EXCLUSION" &&
          entry.enabled !== false
        ) {
          ids.add(entry.itemId);
        }
      }

      for (const otherCatalog of otherCatalogs) {
        for (const entry of otherCatalog) {
          if (
            entry.reason !== "MANUAL_EXCLUSION" &&
            entry.enabled !== false
          ) {
            ids.add(entry.itemId);
          }
        }
      }
      setAllCatalogIds(ids);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de charger les catalogues.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCatalog();
  }, [factionId]);

  useEffect(() => {
    setResults([]);

    if (searchMode === "UNAFFILIATED") {
      void search();
    }
  }, [searchMode]);

  const catalogIds = useMemo(
    () => new Set(catalog.filter((entry) => entry.reason !== "MANUAL_EXCLUSION" && entry.enabled !== false).map((entry) => entry.itemId)),
    [catalog],
  );

  async function search() {
    const value = query.trim();

    if (!value && searchMode !== "UNAFFILIATED") {
      setResults([]);
      return;
    }

    try {
      setSearching(true);
      setError("");

      const found = await searchPaxDeiItems(
        value,
        searchMode === "UNAFFILIATED" ? 1000 : 30,
      );

      setResults(
        searchMode === "UNAFFILIATED"
          ? found.filter((item) => !allCatalogIds.has(item.itemId))
          : found,
      );
    } catch (e) {
      setResults([]);
      setError(e instanceof Error ? e.message : "Recherche impossible.");
    } finally {
      setSearching(false);
    }
  }

  async function addItem(item: PaxDeiItem) {
    try {
      setBusyItemId(item.itemId);
      setError("");
      await addPaxDeiFactionCatalogItem(factionId, item.itemId);
      setMessage(`« ${item.name} » a été ajouté au catalogue.`);
      await loadCatalog();
      setResults([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ajout impossible.");
    } finally {
      setBusyItemId("");
    }
  }

  async function excludeItem(entry: PaxDeiCatalogEntry) {
    if (entry.reason === "MANUAL" || entry.reason === "MANUAL_EXCLUSION") return;

    try {
      setBusyItemId(entry.itemId);
      setError("");
      await excludePaxDeiFactionCatalogItem(factionId, entry.itemId);
      setMessage(`« ${entry.item?.name ?? entry.itemId} » a été exclu du catalogue.`);
      await loadCatalog();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Exclusion impossible.");
    } finally {
      setBusyItemId("");
    }
  }

  async function reinstateItem(entry: PaxDeiCatalogEntry) {
    if (entry.reason !== "MANUAL_EXCLUSION") return;

    try {
      setBusyItemId(entry.itemId);
      setError("");
      await reinstatePaxDeiFactionCatalogItem(factionId, entry.itemId);
      setMessage(`« ${entry.item?.name ?? entry.itemId} » a été réintégré au catalogue.`);
      await loadCatalog();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Réintégration impossible.");
    } finally {
      setBusyItemId("");
    }
  }

  async function removeItem(entry: PaxDeiCatalogEntry) {
    if (entry.reason !== "MANUAL") {
      setError("Une association automatique ne peut pas être supprimée ici. Elle est gérée par la synchronisation Pax Dei.");
      return;
    }

    try {
      setBusyItemId(entry.itemId);
      setError("");
      await removePaxDeiFactionCatalogItem(factionId, entry.itemId);
      setMessage(`« ${entry.item?.name ?? entry.itemId} » a été retiré du catalogue.`);
      await loadCatalog();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Suppression impossible.");
    } finally {
      setBusyItemId("");
    }
  }

  const selectedFaction = FACTIONS.find((faction) => faction.id === factionId)!;

  return (
    <main className="min-h-screen bg-[#071a11] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
            Administration · Pax Dei
          </p>
          <h1 className="mt-2 text-3xl font-bold text-amber-200">
            Catalogues des factions
          </h1>
          <p className="mt-2 max-w-3xl text-emerald-200/80">
            Choisissez les objets que chaque faction peut proposer dans les commandes.
            Les associations ajoutées ici sont manuelles et sont conservées lors des synchronisations.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-900/70 bg-red-950/30 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-5 rounded-xl border border-emerald-800 bg-emerald-950/40 p-4 text-sm text-emerald-200">
            {message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-2xl border border-emerald-900/70 bg-[#071a11]/90 p-4">
            <h2 className="mb-3 px-2 text-sm font-semibold uppercase tracking-wider text-emerald-400">
              Faction
            </h2>

            <div className="relative">
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={factionMenuOpen}
                onClick={() => setFactionMenuOpen((open) => !open)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-emerald-800 bg-[#06150d] p-4 text-left transition hover:border-amber-600"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="text-2xl">{selectedFaction.icon}</span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-emerald-100">
                      {selectedFaction.name}
                    </span>
                    <span className="mt-1 block text-xs text-emerald-300/70">
                      {selectedFaction.description}
                    </span>
                  </span>
                </span>
                <span
                  className={`shrink-0 text-emerald-300 transition ${
                    factionMenuOpen ? "rotate-180" : ""
                  }`}
                >
                  ▾
                </span>
              </button>

              {factionMenuOpen && (
                <div
                  role="listbox"
                  className="absolute left-0 right-0 z-50 mt-2 max-h-72 overflow-y-auto rounded-xl border border-emerald-700 !bg-[#06150d] p-1 shadow-2xl shadow-black/80"
                >
                  {FACTIONS.map((faction) => (
                    <button
                      key={faction.id}
                      type="button"
                      role="option"
                      aria-selected={faction.id === factionId}
                      onClick={() => {
                        setFactionId(faction.id);
                        setResults([]);
                        setMessage("");
                        setFactionMenuOpen(false);
                      }}
                      className={`w-full rounded-lg p-3 text-left transition ${
                        faction.id === factionId
                          ? "bg-amber-950/40 text-amber-100"
                          : "text-emerald-100 hover:bg-emerald-950/60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{faction.icon}</span>
                        <span className="min-w-0">
                          <span className="block font-semibold">{faction.name}</span>
                          <span className="mt-1 block text-xs text-emerald-300/70">
                            {faction.description}
                          </span>
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <p className="mt-3 px-1 text-xs leading-5 text-emerald-400/70">
              Sélectionnez une faction pour gérer son catalogue.
            </p>
          </aside>

          <section className="space-y-6">
            <div className="rounded-2xl border border-emerald-900/70 bg-[#071a11]/90 p-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-amber-200">
                    {selectedFaction.icon} {selectedFaction.name}
                  </h2>
                  <p className="mt-1 text-sm text-emerald-300/70">
                    {catalog.length} association{catalog.length > 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <label className="text-sm font-semibold text-emerald-100">
                  Ajouter un objet Pax Dei
                </label>
                <div className="mt-3 grid gap-3 sm:grid-cols-[220px_1fr]">
                  <select
                    value={searchMode}
                    onChange={(event) =>
                      setSearchMode(event.target.value as "ALL" | "UNAFFILIATED")
                    }
                    className="rounded-lg border border-emerald-800 bg-[#06150d] px-3 py-2 text-sm text-white outline-none focus:border-amber-600"
                  >
                    <option value="ALL">Tous les objets</option>
                    <option value="UNAFFILIATED">Objets non affiliés</option>
                  </select>

                  <div className="flex gap-2">
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void search();
                        }
                      }}
                      placeholder={
                        searchMode === "UNAFFILIATED"
                          ? "Filtrer les objets non affiliés…"
                          : "Ex. gneiss, lingot d'acier, épée…"
                      }
                      className="min-w-0 flex-1 rounded-lg border border-emerald-800 bg-[#06150d] px-3 py-2 text-white outline-none focus:border-amber-600"
                    />
                    <button
                      type="button"
                      onClick={() => void search()}
                      disabled={searching || (searchMode !== "UNAFFILIATED" && !query.trim())}
                      className="rounded-lg bg-amber-700 px-5 py-2 font-semibold text-white disabled:opacity-50"
                    >
                      {searching ? "Recherche…" : "Rechercher"}
                    </button>
                  </div>
                </div>

                <p className="mt-2 text-xs text-emerald-400/70">
                  {searchMode === "UNAFFILIATED"
                    ? "Tous les objets non affiliés sont affichés. Utilisez la recherche pour affiner la liste."
                    : `Recherche dans les objets Pax Dei disponibles. Les objets déjà présents dans ${selectedFaction.name} sont signalés.`}
                </p>

                {!!results.length && (
                  <div className="mt-3 max-h-80 overflow-y-auto rounded-xl border border-emerald-800 bg-[#06150d]">
                    {results.map((item) => {
                      const already = catalogIds.has(item.itemId);
                      return (
                        <div
                          key={item.itemId}
                          className="flex items-center gap-3 border-b border-emerald-900/60 p-3 last:border-b-0"
                        >
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt=""
                              className="h-10 w-10 rounded-lg object-contain"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-emerald-950" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-emerald-100">{item.name}</p>
                            <p className="truncate text-xs text-emerald-500">{item.itemId}</p>
                          </div>
                          {already ? (
                            <span className="rounded-lg bg-emerald-950 px-3 py-2 text-xs text-emerald-300">
                              Déjà présent
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => void addItem(item)}
                              disabled={busyItemId === item.itemId}
                              className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                            >
                              {busyItemId === item.itemId ? "Ajout…" : "Ajouter"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {!searching && (query.trim() || searchMode === "UNAFFILIATED") && !results.length && (
                  <p className="mt-3 rounded-lg border border-emerald-900/70 bg-emerald-950/20 p-3 text-sm text-emerald-300/80">
                    Aucun objet correspondant dans ce mode de recherche.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-900/70 bg-[#071a11]/90">
              <div className="border-b border-emerald-900 px-6 py-4">
                <h2 className="font-bold text-emerald-100">Objets du catalogue</h2>
                <p className="mt-1 text-xs text-emerald-400/70">
                  Les objets automatiques sont pilotés par la synchronisation. Les objets manuels peuvent être retirés ici.
                </p>
              </div>

              {loading ? (
                <div className="p-8 text-center text-emerald-300">Chargement…</div>
              ) : !catalog.length ? (
                <div className="p-8 text-center text-emerald-300">
                  Aucun objet dans ce catalogue.
                </div>
              ) : (
                <div className="max-h-[60vh] overflow-y-auto divide-y divide-emerald-900/60">
                  {catalog.map((entry) => (
                    <div key={entry._id} className="flex items-center gap-4 p-4">
                      {entry.item?.imageUrl ? (
                        <img
                          src={entry.item.imageUrl}
                          alt=""
                          className="h-12 w-12 rounded-lg object-contain"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-emerald-950" />
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-emerald-100">
                          {entry.item?.name ?? entry.itemId}
                        </p>
                        <p className="truncate text-xs text-emerald-500">{entry.itemId}</p>
                        {entry.reason === "MANUAL_EXCLUSION" && (
                          <p className="mt-1 text-xs text-red-300/80">
                            Ne sera pas réactivé par la synchronisation.
                          </p>
                        )}
                      </div>

                      <span
                        className={`hidden rounded-lg px-3 py-1 text-xs md:inline-block ${
                          entry.reason === "MANUAL"
                            ? "bg-amber-950/50 text-amber-300"
                            : entry.reason === "MANUAL_EXCLUSION"
                              ? "bg-red-950/60 text-red-300"
                              : "bg-emerald-950 text-emerald-300"
                        }`}
                      >
                        {reasonLabel(entry.reason)}
                      </span>

                      {entry.reason === "MANUAL_EXCLUSION" && (
                        <button
                          type="button"
                          onClick={() => void reinstateItem(entry)}
                          disabled={busyItemId === entry.itemId}
                          className="rounded-lg border border-emerald-800 px-3 py-2 text-sm text-emerald-300 hover:bg-emerald-950/40 disabled:opacity-50"
                        >
                          {busyItemId === entry.itemId ? "Réintégration…" : "Réintégrer"}
                        </button>
                      )}

                      {entry.reason !== "MANUAL" && entry.reason !== "MANUAL_EXCLUSION" && (
                        <button
                          type="button"
                          onClick={() => void excludeItem(entry)}
                          disabled={busyItemId === entry.itemId}
                          className="rounded-lg border border-red-900/70 px-3 py-2 text-sm text-red-300 hover:bg-red-950/30 disabled:opacity-50"
                        >
                          {busyItemId === entry.itemId ? "Exclusion…" : "Exclure"}
                        </button>
                      )}

                      {entry.reason === "MANUAL" && (
                        <button
                          type="button"
                          onClick={() => void removeItem(entry)}
                          disabled={busyItemId === entry.itemId}
                          className="rounded-lg border border-red-900/70 px-3 py-2 text-sm text-red-300 hover:bg-red-950/30 disabled:opacity-50"
                        >
                          Retirer
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
