"use client";

import { useState } from "react";

export default function MembreQuetesPage() {
  const [userId, setUserId] = useState("");

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-500">
            Administration
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            Quêtes d&apos;un membre
          </h1>

          <p className="mt-3 text-gray-400">
            Consultez et validez manuellement la progression des quêtes d&apos;un
            membre.
          </p>
        </div>

        <section className="rounded-xl border border-white/10 bg-black/20 p-6">
          <h2 className="mb-4 text-xl font-semibold">
            Sélectionner un membre
          </h2>

          <div className="flex gap-3">
            <input
              type="text"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              placeholder="ID du membre"
              className="flex-1 rounded-lg border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-amber-500"
            />

            <button
              type="button"
              className="rounded-lg bg-amber-600 px-5 py-3 font-semibold hover:bg-amber-500"
            >
              Rechercher
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}