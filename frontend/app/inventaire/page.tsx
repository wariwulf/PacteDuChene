"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InventairePage() {
  const router = useRouter();

  const [memberId, setMemberId] = useState("");

  function openInventory(event: React.FormEvent) {
    event.preventDefault();

    const id = memberId.trim();

    if (!id) {
      return;
    }

    router.push(`/inventaire/${encodeURIComponent(id)}`);
  }

  return (
    <main className="min-h-screen bg-green-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-400">
            Le Pacte du Chêne
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            Inventaire
          </h1>

          <p className="mt-3 text-green-300">
            Consultez l'inventaire d'un membre du Pacte.
          </p>
        </div>

        <section className="rounded-xl border border-green-800 bg-green-900/50 p-8">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Rechercher un inventaire
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            Identifiant du membre
          </h2>

          <p className="mt-2 text-green-400">
            Entrez l'identifiant du membre pour consulter ses objets.
          </p>

          <form
            onSubmit={openInventory}
            className="mt-6 flex flex-col gap-4 sm:flex-row"
          >
            <input
              type="text"
              value={memberId}
              onChange={(event) =>
                setMemberId(event.target.value)
              }
              placeholder="Ex. 6a84af62efe2b87173cd3daa"
              className="min-w-0 flex-1 rounded-lg border border-green-700 bg-green-950 px-4 py-3 text-white outline-none placeholder:text-green-600 focus:border-amber-500"
            />

            <button
              type="submit"
              disabled={!memberId.trim()}
              className="rounded-lg bg-amber-600 px-6 py-3 font-semibold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Voir l'inventaire
            </button>
          </form>
        </section>

        <section className="mt-6 rounded-xl border border-green-800 bg-green-900/30 p-6">
          <p className="text-sm text-green-400">
            💡 L'administration pourra utiliser directement l'URL
            d'un membre pour consulter son inventaire.
          </p>
        </section>
      </div>
    </main>
  );
}