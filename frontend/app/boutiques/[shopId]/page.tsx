"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface Item {
  itemId: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  enabled: boolean;
}
interface Shop {
  shopId: string;
  name: string;
  description?: string;
  currencyId: string;
  enabled: boolean;
  items: Item[];
}

export default function BoutiqueDetailPage() {
  const params = useParams();
  const shopId = String(params?.shopId ?? "");
  const [shop, setShop] = useState<Shop | null>(null);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadShop() {
    if (!shopId) return;
    try {
      setLoading(true); setError(""); setSuccess("");
      const response = await fetch(`${API_URL}/shops/${encodeURIComponent(shopId)}`);
      if (!response.ok) throw new Error(`Erreur serveur (${response.status})`);
      const payload = await response.json();
      setShop(payload?.data?.shop ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger la boutique.");
    } finally { setLoading(false); }
  }

  useEffect(() => { loadShop(); }, [shopId]);

  async function buyItem(itemId: string) {
    if (!userId.trim()) {
      setError("Veuillez renseigner l'identifiant du membre avant l'achat.");
      return;
    }
    try {
      setBuying(itemId); setError(""); setSuccess("");
      const response = await fetch(`${API_URL}/shops/${encodeURIComponent(shopId)}/items/${encodeURIComponent(itemId)}/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userId.trim() }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.message || `Erreur serveur (${response.status})`);
      const result = payload?.data;
      setSuccess(`Achat réussi : ${result?.itemName ?? "article"} pour ${result?.price ?? 0} ${result?.currencyId ?? shop?.currencyId ?? ""}.`);
      await loadShop();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'effectuer l'achat.");
    } finally { setBuying(""); }
  }

  return (
    <main className="min-h-screen bg-green-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link href="/boutiques" className="text-green-300 hover:text-white">← Retour aux boutiques</Link>
          <button onClick={loadShop} disabled={loading} className="rounded-lg bg-amber-600 px-5 py-3 font-semibold hover:bg-amber-500 disabled:opacity-50">Actualiser</button>
        </div>

        {loading && <div className="rounded-xl border border-green-800 bg-green-900/50 p-10 text-center text-green-300">Chargement de la boutique...</div>}

        {!loading && error && !shop && (
          <div className="rounded-xl border border-red-700 bg-red-950/40 p-8 text-red-300">
            <h1 className="text-2xl font-bold">Boutique introuvable</h1><p className="mt-2">{error}</p>
          </div>
        )}

        {!loading && shop && (
          <>
            <header className="mb-8">
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-400">{shop.shopId}</p>
              <div className="mt-2 flex flex-wrap items-center gap-4">
                <h1 className="text-4xl font-bold">{shop.name}</h1>
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${shop.enabled ? "bg-green-700 text-green-100" : "bg-red-900 text-red-300"}`}>
                  {shop.enabled ? "Ouverte" : "Fermée"}
                </span>
              </div>
              <p className="mt-3 text-green-300">{shop.description || "Aucune description."}</p>
            </header>

            <section className="mb-8 rounded-xl border border-green-800 bg-green-900/60 p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Acheteur</p>
              <h2 className="mt-2 text-xl font-bold">Identifiant du membre</h2>
              <p className="mt-1 text-sm text-green-300">Identifiant transmis au backend pour effectuer l'achat.</p>
              <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="Ex. 6a84af62efe2b87173cd3daa"
                className="mt-4 w-full rounded-lg border border-green-700 bg-green-950 px-4 py-3 text-white outline-none placeholder:text-green-600 focus:border-amber-500" />
            </section>

            {error && <div className="mb-6 rounded-lg border border-red-700 bg-red-950/40 p-4 text-red-300">{error}</div>}
            {success && <div className="mb-6 rounded-lg border border-green-700 bg-green-900/60 p-4 text-green-300">{success}</div>}

            <section>
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-2xl font-bold">Articles</h2>
                <span className="text-sm text-green-400">Monnaie : {shop.currencyId}</span>
              </div>

              {shop.items.length === 0 ? (
                <div className="rounded-xl border border-green-800 bg-green-900/50 p-10 text-center text-green-300">Aucun article dans cette boutique.</div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {shop.items.map((item) => {
                    const unlimited = item.stock < 0;
                    const soldOut = !unlimited && item.stock <= 0;
                    const unavailable = !shop.enabled || !item.enabled || soldOut;
                    return (
                      <article key={item.itemId} className="rounded-xl border border-green-800 bg-green-900/60 p-6">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-amber-400">{item.itemId}</p>
                            <h3 className="mt-2 text-xl font-bold">{item.name}</h3>
                          </div>
                          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${item.enabled && !soldOut ? "bg-green-700 text-green-100" : "bg-red-900 text-red-300"}`}>
                            {soldOut ? "Épuisé" : item.enabled ? "Disponible" : "Indisponible"}
                          </span>
                        </div>
                        <p className="mt-4 min-h-12 text-green-300">{item.description || "Aucune description."}</p>
                        <div className="mt-5 rounded-lg border border-green-800 bg-green-950/60 p-4">
                          <p className="text-xs uppercase text-green-400">Prix</p>
                          <p className="mt-1 text-2xl font-bold text-amber-400">{item.price} {shop.currencyId}</p>
                          <p className="mt-2 text-sm text-green-400">Stock : {unlimited ? "Illimité" : item.stock}</p>
                        </div>
                        <button onClick={() => buyItem(item.itemId)} disabled={unavailable || buying === item.itemId}
                          className="mt-5 w-full rounded-lg bg-amber-600 px-4 py-3 font-semibold hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-40">
                          {buying === item.itemId ? "Achat..." : soldOut ? "Épuisé" : "Acheter"}
                        </button>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
