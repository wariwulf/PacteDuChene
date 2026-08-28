"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

interface InventoryItem {
  userId: string;
  itemId: string;
  quantity: number;
  acquiredAt: string;
}

interface InventoryResponse {
  success: boolean;
  data?: InventoryItem[];
  message?: string;
}

export default function InventaireMemberPage() {
  const params = useParams();

  const id =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
        ? params.id[0]
        : "";

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadInventory() {
    if (!id) {
      setError("Identifiant du membre manquant.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/inventory/${encodeURIComponent(id)}`
      );

      const payload: InventoryResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          payload.message || `Erreur serveur (${response.status})`
        );
      }

      if (!payload.success) {
        throw new Error(
          payload.message || "Impossible de charger l'inventaire."
        );
      }

      setItems(Array.isArray(payload.data) ? payload.data : []);
    } catch (err) {
      console.error("Erreur chargement inventaire :", err);

      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger l'inventaire."
      );

      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInventory();
  }, [id]);

  return (
    <main className="min-h-screen bg-green-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-400">
              Le Pacte du Chêne
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              Inventaire
            </h1>

            <p className="mt-2 text-green-300">
              Objets possédés par ce membre.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href={`/membres/${id}`}
              className="rounded-lg border border-green-700 bg-green-900 px-5 py-3 font-semibold text-white transition hover:bg-green-800"
            >
              ← Retour au membre
            </Link>

            <button
              type="button"
              onClick={loadInventory}
              disabled={loading}
              className="rounded-lg bg-amber-600 px-5 py-3 font-semibold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Chargement..." : "Actualiser"}
            </button>
          </div>
        </div>

        {loading && (
          <section className="rounded-xl border border-green-800 bg-green-900/50 p-8 text-center">
            <p className="text-green-300">
              Chargement de l'inventaire...
            </p>
          </section>
        )}

        {!loading && error && (
          <section className="rounded-xl border border-red-700 bg-red-950/40 p-6">
            <h2 className="text-xl font-bold text-red-300">
              Impossible de charger l'inventaire
            </h2>

            <p className="mt-2 text-red-200">
              {error}
            </p>

            <button
              type="button"
              onClick={loadInventory}
              className="mt-5 rounded-lg bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-500"
            >
              Réessayer
            </button>
          </section>
        )}

        {!loading && !error && (
          <>
            <section className="mb-6 rounded-xl border border-green-800 bg-green-900/50 p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Membre
              </p>

              <p className="mt-2 break-all font-mono text-sm text-green-300">
                {id}
              </p>

              <div className="mt-5">
                <p className="text-3xl font-bold">
                  {items.length}
                </p>

                <p className="text-sm text-green-300">
                  {items.length > 1
                    ? "types d'objets"
                    : "type d'objet"}
                </p>
              </div>
            </section>

            {items.length === 0 ? (
              <section className="rounded-xl border border-green-800 bg-green-900/50 p-10 text-center">
                <div className="text-5xl">📦</div>

                <h2 className="mt-4 text-2xl font-bold text-green-200">
                  Inventaire vide
                </h2>

                <p className="mt-2 text-green-400">
                  Ce membre ne possède actuellement aucun objet.
                </p>
              </section>
            ) : (
              <section>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => (
                    <article
                      key={`${item.itemId}-${item.acquiredAt}`}
                      className="rounded-xl border border-green-800 bg-green-900/60 p-6 transition hover:border-amber-600"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
                            Objet
                          </p>

                          <h2 className="mt-2 break-words text-xl font-bold text-white">
                            {item.itemId}
                          </h2>
                        </div>

                        <div className="rounded-lg border border-amber-600/40 bg-amber-950/30 px-4 py-2 text-center">
                          <p className="text-xs text-amber-400">
                            Quantité
                          </p>

                          <p className="text-2xl font-bold text-amber-300">
                            {item.quantity}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 border-t border-green-800 pt-4">
                        <p className="text-xs uppercase tracking-wider text-green-500">
                          Acquis le
                        </p>

                        <p className="mt-1 text-sm text-green-200">
                          {item.acquiredAt
                            ? new Date(
                                item.acquiredAt
                              ).toLocaleString("fr-FR")
                            : "Date inconnue"}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}