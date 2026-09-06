"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { buyShopItem, getShop, type Shop } from "@/services/shops.service";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");
const tiers = ["", "I", "II", "III", "IV", "V"];

function mediaUrl(url?: string) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;
}

function currencyLabel(currencyId: string) {
  if (currencyId === "bronze") return "Bronze";
  if (currencyId === "argent") return "Argent";
  return "Solidus";
}

export default function BoutiqueDetailPage() {
  const params = useParams();
  const shopId = String(params?.shopId ?? "");
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState("");
  const [qty, setQty] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");
      setShop(await getShop(shopId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de charger la boutique.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [shopId]);

  async function buy(itemId: string) {
    try {
      setBuying(itemId);
      setError("");
      setSuccess("");
      const quantity = Math.max(1, Number(qty[itemId] ?? 1));
      const result = await buyShopItem(shopId, itemId, quantity);
      setSuccess(`${quantity} × ${result.purchase.itemName} ont été ajoutés à votre inventaire.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible d'effectuer l'achat.");
    } finally {
      setBuying("");
    }
  }

  return (
    <main className="min-h-screen bg-[#07150f] px-6 py-12 text-white">
      <div className="mx-auto max-w-7xl">
        <Link href="/boutiques" className="text-amber-300 hover:text-amber-200">
          ← Retour aux boutiques
        </Link>

        {loading ? (
          <div className="p-10 text-center text-green-300">Chargement...</div>
        ) : !shop ? (
          <div className="mt-8 rounded-xl bg-red-950 p-8 text-red-200">
            {error || "Boutique introuvable."}
          </div>
        ) : (
          <>
            <header className="my-10">
              <p className="text-xs uppercase tracking-[.3em] text-amber-400">{shop.shopId}</p>
              <h1 className="mt-2 font-[var(--font-cinzel)] text-4xl font-bold text-[#f4e6c5]">
                {shop.name}
              </h1>
              <p className="mt-4 max-w-3xl text-green-100/80">{shop.description}</p>
            </header>

            {error && <div className="mb-5 rounded-lg bg-red-950 p-4 text-red-200">{error}</div>}
            {success && <div className="mb-5 rounded-lg bg-green-900 p-4 text-green-200">{success}</div>}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {shop.items.map((item) => {
                const sold = item.stock >= 0 && item.stock === 0;
                const unavailable = !shop.enabled || !item.enabled || sold;
                const image = mediaUrl(item.imageUrl);

                return (
                  <article
                    key={item.itemId}
                    className="overflow-hidden rounded-2xl border border-amber-700/40 bg-[#0a1b13]/95 shadow-xl"
                  >
                    {image ? (
                      <img src={image} alt="" className="h-52 w-full object-cover" />
                    ) : (
                      <div className="flex h-52 items-center justify-center bg-gradient-to-br from-[#173d2b] to-[#07150f] text-sm text-green-700">
                        Aucune image
                      </div>
                    )}

                    <div className="p-6">
                      <div className="flex justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-widest text-amber-400">
                            Tier {tiers[item.tier]}
                          </p>
                          <h2 className="mt-2 text-xl font-bold">{item.name}</h2>
                        </div>
                        <span className="whitespace-nowrap text-amber-300">
                          {item.price} {currencyLabel(item.currencyId)}
                        </span>
                      </div>

                      <p className="mt-4 min-h-16 text-green-100/70">
                        {item.description || "Aucune description."}
                      </p>

                      {item.externalUrl && (
                        <a
                          href={item.externalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-block text-sm text-amber-300"
                        >
                          Voir les détails externes ↗
                        </a>
                      )}

                      <p className="mt-4 text-sm text-green-300">
                        Stock : {item.stock < 0 ? "Illimité" : item.stock}
                      </p>
                      {item.purchaseLimit && (
                        <p className="mt-1 text-xs text-gray-400">
                          Limite : {item.purchaseLimit} / {item.purchaseLimitWindowHours} h
                        </p>
                      )}

                      <div className="mt-5 flex gap-2">
                        <input
                          type="number"
                          min="1"
                          max={item.stock >= 0 ? item.stock : undefined}
                          value={qty[item.itemId] ?? 1}
                          onChange={(e) =>
                            setQty((current) => ({
                              ...current,
                              [item.itemId]: Number(e.target.value),
                            }))
                          }
                          className="w-20 rounded-lg bg-green-950 p-3"
                        />
                        <button
                          onClick={() => void buy(item.itemId)}
                          disabled={unavailable || buying === item.itemId}
                          className="flex-1 rounded-lg bg-amber-600 px-4 py-3 font-semibold disabled:opacity-40"
                        >
                          {buying === item.itemId ? "Achat..." : sold ? "Épuisé" : "Acheter"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
