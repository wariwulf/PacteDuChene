"use client";

import { useState } from "react";
import {
  createFactionOrder,
  type Faction,
  type OrderItem,
  type OrderKind,
  type OrderVisibility,
} from "@/services/factions.service";
import {
  getPaxDeiRecipe,
  searchPaxDeiItems,
  type PaxDeiItem,
  type PaxDeiRecipe,
} from "@/services/paxdei.service";

const FACTION_IMAGES: Record<string, string> = {
  "domaine-du-chene": "/images/pacte/faction-domaine.png",
  "guilde-des-artisans": "/images/pacte/faction-artisans.png",
  "confrerie-de-lepee": "/images/pacte/faction-confrerie.png",
};

const FACTION_THEMES: Record<
  string,
  {
    accent: string;
    border: string;
    selected: string;
    imageBorder: string;
  }
> = {
  "domaine-du-chene": {
    accent: "text-emerald-300",
    border: "border-emerald-800/70",
    selected: "border-emerald-500/80 bg-emerald-950/25",
    imageBorder: "border-emerald-800/70",
  },
  "guilde-des-artisans": {
    accent: "text-sky-300",
    border: "border-sky-800/70",
    selected: "border-sky-500/80 bg-sky-950/25",
    imageBorder: "border-sky-800/70",
  },
  "confrerie-de-lepee": {
    accent: "text-red-300",
    border: "border-red-900/70",
    selected: "border-red-500/80 bg-red-950/20",
    imageBorder: "border-red-900/70",
  },
};

function itemImageUrl(item: PaxDeiItem | null): string {
  if (!item) return "";

  const raw = item.imageUrl || "";
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) {
    return `https://cdn-hosted.gaming.tools/paxdei${raw}`;
  }
  return raw;
}

export default function OrderForm({
  faction,
  kind,
  clan = false,
  onCreated,
}: {
  faction: Faction;
  kind: OrderKind;
  clan?: boolean;
  onCreated: (orderId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PaxDeiItem[]>([]);
  const [item, setItem] = useState<PaxDeiItem | null>(null);
  const [recipe, setRecipe] = useState<PaxDeiRecipe | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] =
    useState<OrderVisibility>("PUBLIC");
  const [busy, setBusy] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  const factionImage = FACTION_IMAGES[faction.factionId];
  const theme =
    FACTION_THEMES[faction.factionId] ?? FACTION_THEMES["domaine-du-chene"];

  function clearSelection() {
    setItem(null);
    setRecipe(null);
    setQuantity(1);
    setResults([]);
    setQuery("");
  }

  async function search() {
    const value = query.trim();
    if (!value) {
      setResults([]);
      return;
    }

    try {
      setSearching(true);
      setError("");
      setResults(
        await searchPaxDeiItems(value, 12, faction.factionId),
      );
    } catch (e) {
      setResults([]);
      setError(
        e instanceof Error ? e.message : "Recherche impossible.",
      );
    } finally {
      setSearching(false);
    }
  }

  function selectItem(selected: PaxDeiItem) {
    setItem(selected);
    setResults([]);
    setQuery(selected.name);
    setRecipe(null);
    setQuantity(1);
    setError("");

    if (kind === "CRAFT") {
      void getPaxDeiRecipe(selected.itemId)
        .then(setRecipe)
        .catch(() => setRecipe(null));
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (!item) {
      setError("Sélectionnez un élément.");
      return;
    }

    try {
      setBusy(true);
      setError("");

      const orderItem: OrderItem = {
        itemId: item.itemId,
        name: item.name,
        imageUrl: item.imageUrl,
        externalUrl: item.externalUrl,
        quantity,
        kind: "PAXDEI_ITEM",
      };

      const order = await createFactionOrder(faction.factionId, {
        kind: clan ? "CLAN" : kind,
        visibility,
        title: title.trim() || `${quantity} × ${item.name}`,
        message: message.trim() || undefined,
        items: [orderItem],
        recipeIngredients: recipe?.ingredients ?? [],
      });

      onCreated(order.orderId);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Création de la commande impossible.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-emerald-900/80 bg-[#071a11] p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">
            Nouvelle commande
          </p>
          <h2 className="mt-1 text-2xl font-bold text-amber-200">
            {faction.name}
          </h2>
          <p className="mt-1 text-sm text-emerald-300/70">
            {faction.description}
          </p>
        </div>

        {factionImage && (
          <div
            className={`flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border ${theme.imageBorder} bg-[#06150d]`}
          >
            <img
              src={factionImage}
              alt=""
              className="h-16 w-16 object-contain"
            />
          </div>
        )}
      </div>

      <div className="mt-6">
        <label
          htmlFor="paxdei-order-search"
          className="text-sm font-semibold text-emerald-100"
        >
          Objet demandé
        </label>

        <div className="mt-2 flex gap-2">
          <input
            id="paxdei-order-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Rechercher dans ${faction.name}...`}
            className="min-w-0 flex-1 border border-emerald-800 bg-[#06150d] px-3 py-2.5 text-sm text-white outline-none placeholder:text-emerald-700 focus:border-amber-600"
          />
          <button
            type="button"
            onClick={() => void search()}
            disabled={searching}
            className="shrink-0 border border-amber-700/70 bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {searching ? "..." : "Rechercher"}
          </button>
        </div>

        {results.length > 0 && (
          <div className="mt-2 border border-emerald-800 bg-[#06150d]">
            {results.map((result) => (
              <button
                key={result.itemId}
                type="button"
                onClick={() => selectItem(result)}
                className="flex w-full items-center gap-3 border-b border-emerald-900/70 px-3 py-3 text-left last:border-b-0 hover:bg-emerald-950/30"
              >
                {itemImageUrl(result) ? (
                  <img
                    src={itemImageUrl(result)}
                    alt=""
                    className="h-10 w-10 shrink-0 object-contain"
                  />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-emerald-900 text-emerald-700">
                    ◇
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-emerald-50">
                    {result.name}
                  </span>
                  <span className="text-xs text-emerald-500">
                    {result.itemId}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}

        {item && (
          <div className="mt-3 flex items-center gap-3 border border-emerald-800 bg-[#06150d] p-3">
            {itemImageUrl(item) ? (
              <img
                src={itemImageUrl(item)}
                alt=""
                className="h-12 w-12 shrink-0 object-contain"
              />
            ) : (
              <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-emerald-900 text-emerald-700">
                ◇
              </span>
            )}

            <div className="min-w-0 flex-1">
              <p className="font-semibold text-emerald-50">{item.name}</p>
              <p className="mt-1 text-xs text-emerald-500">
                Objet sélectionné
              </p>
            </div>

            <label className="flex shrink-0 items-center gap-2 text-xs text-emerald-400">
              Qté
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, Number(e.target.value) || 1))
                }
                className="w-16 border border-emerald-800 bg-[#071a11] px-2 py-2 text-center text-white outline-none focus:border-amber-600"
              />
            </label>

            <button
              type="button"
              onClick={clearSelection}
              className="border border-red-900/70 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-950/20"
            >
              Retirer
            </button>
          </div>
        )}

        {kind === "CRAFT" && item && recipe && (
          <div className="mt-4 border border-amber-900/50 bg-amber-950/10 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-500">
                  Fabrication
                </p>
                <p className={`mt-1 text-sm font-semibold ${theme.accent}`}>
                  Ingrédients nécessaires
                </p>
              </div>
              <span className="text-xs text-amber-300/70">
                Pour {quantity} exemplaire{quantity > 1 ? "s" : ""}
              </span>
            </div>

            {recipe.ingredients.length > 0 ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {recipe.ingredients.map((ingredient, index) => (
                  <div
                    key={`${ingredient.itemId ?? ingredient.name}-${index}`}
                    className="flex items-center justify-between border border-amber-900/30 bg-[#06150d] px-3 py-2.5"
                  >
                    <span className="text-sm text-amber-100">
                      {ingredient.name}
                    </span>
                    <span className="ml-3 shrink-0 text-sm font-bold text-amber-300">
                      × {ingredient.quantity * quantity}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-amber-200/80">
                La recette est disponible, mais aucun ingrédient n'est
                actuellement renseigné.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-5">
        <label
          htmlFor="paxdei-order-title"
          className="text-sm font-semibold text-emerald-100"
        >
          Titre
        </label>
        <input
          id="paxdei-order-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex. Approvisionnement en lingots"
          className="mt-2 w-full border border-emerald-800 bg-[#06150d] px-3 py-2.5 text-sm text-white outline-none placeholder:text-emerald-700 focus:border-amber-600"
        />
      </div>

      <div className="mt-5">
        <label
          htmlFor="paxdei-order-message"
          className="text-sm font-semibold text-emerald-100"
        >
          Précisions
        </label>
        <textarea
          id="paxdei-order-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="mt-2 w-full resize-y border border-emerald-800 bg-[#06150d] px-3 py-2.5 text-sm text-white outline-none placeholder:text-emerald-700 focus:border-amber-600"
        />
      </div>

      <label className="mt-5 flex items-center gap-2 text-sm text-emerald-300">
        <input
          type="checkbox"
          checked={visibility === "PRIVATE"}
          onChange={(e) =>
            setVisibility(e.target.checked ? "PRIVATE" : "PUBLIC")
          }
        />
        Commande privée
        <span className="text-xs text-emerald-500">
          (demandeur + chef + propriétaire)
        </span>
      </label>

      {error && (
        <div className="mt-4 border border-red-900/70 bg-red-950/15 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={busy || !item}
        className="mt-5 border border-amber-700/70 bg-amber-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "Création..." : "Passer la commande"}
      </button>
    </form>
  );
}
