"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface Shop {
  shopId: string;
  name: string;
  description?: string;
  currencyId: string;
  enabled: boolean;
  items: {
    itemId: string;
    name: string;
    price: number;
    stock: number;
    enabled: boolean;
  }[];
}

export default function BoutiquesPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadShops() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/shops`);

      if (!response.ok) {
        throw new Error(`Erreur serveur (${response.status})`);
      }

      const payload = await response.json();
      setShops(payload?.data?.shops ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger les boutiques."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadShops();
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      {/* Fond de la boutique */}
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/boutique-background.png')",
        }}
      />

      {/* Voile sombre : conserve la lisibilité du contenu sans masquer le décor */}
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 bg-black/55"
      />

      {/* Dégradé inférieur pour intégrer naturellement le contenu au site */}
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 bg-gradient-to-b from-black/15 via-black/10 to-[#02100a]/85"
      />

      <div className="mx-auto max-w-7xl px-6 py-12">
        <header className="mb-10 flex flex-col gap-6 rounded-2xl border border-amber-700/40 bg-[#07140f]/70 p-7 shadow-2xl backdrop-blur-sm md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-400">
              Le Pacte du Chêne
            </p>
            <h1 className="mt-2 font-[var(--font-cinzel)] text-4xl font-bold text-[#f4e6c5] md:text-5xl">
              Boutiques
            </h1>
            <p className="mt-3 max-w-2xl text-green-100/90">
              Découvrez les commerces et équipements disponibles au sein du
              Pacte.
            </p>
          </div>

          <button
            type="button"
            onClick={loadShops}
            disabled={loading}
            className="shrink-0 rounded-lg border border-amber-500/70 bg-amber-600/90 px-5 py-3 font-semibold text-white shadow-lg transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Chargement..." : "Actualiser"}
          </button>
        </header>

        {error && (
          <div className="mb-8 rounded-xl border border-red-700/70 bg-red-950/80 p-5 text-red-200 shadow-xl backdrop-blur-sm">
            <p className="font-semibold">Impossible de charger les boutiques</p>
            <p className="mt-1">{error}</p>
            <button
              type="button"
              onClick={loadShops}
              className="mt-4 rounded-lg bg-red-700 px-4 py-2 font-semibold transition hover:bg-red-600"
            >
              Réessayer
            </button>
          </div>
        )}

        {!loading && !error && shops.length === 0 && (
          <section className="rounded-2xl border border-amber-700/40 bg-[#20150c]/80 p-12 text-center shadow-2xl backdrop-blur-sm">
            <div className="text-5xl">🏪</div>
            <h2 className="mt-4 font-[var(--font-cinzel)] text-2xl font-bold text-[#f4e6c5]">
              Aucune boutique
            </h2>
            <p className="mt-2 text-amber-100/80">
              Les boutiques du Pacte seront bientôt disponibles.
            </p>
          </section>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {shops.map((shop) => (
            <article
              key={shop.shopId}
              className="flex min-h-[330px] flex-col rounded-2xl border border-amber-700/45 bg-[#0a1b13]/85 p-6 shadow-2xl backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-amber-500/70 hover:bg-[#0a1b13]/90"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    {shop.shopId}
                  </p>
                  <h2 className="mt-2 font-[var(--font-cinzel)] text-2xl font-bold text-[#f4e6c5]">
                    {shop.name}
                  </h2>
                </div>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    shop.enabled
                      ? "border-green-500/40 bg-green-900/70 text-green-100"
                      : "border-red-500/40 bg-red-950/70 text-red-200"
                  }`}
                >
                  {shop.enabled ? "Ouverte" : "Fermée"}
                </span>
              </div>

              <p className="mt-5 min-h-20 text-green-100/85">
                {shop.description || "Aucune description."}
              </p>

              <div className="mt-auto flex items-center justify-between border-t border-amber-700/30 pt-5">
                <span className="text-sm text-green-200/80">
                  {shop.items.length} article
                  {shop.items.length > 1 ? "s" : ""}
                </span>

                <Link
                  href={`/boutiques/${encodeURIComponent(shop.shopId)}`}
                  className="rounded-lg border border-amber-500/60 bg-amber-600/90 px-5 py-3 font-semibold text-white shadow-lg transition hover:bg-amber-500"
                >
                  Voir la boutique →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
