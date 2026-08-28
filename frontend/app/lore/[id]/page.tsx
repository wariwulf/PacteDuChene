"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import LoreReader from "@/components/lore/LoreReader";
import type { LoreEntry } from "@/components/lore/LoreLibraryTypes";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function LoreEntryPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [entry, setEntry] = useState<LoreEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    if (!id) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/lore/${encodeURIComponent(String(id))}`,
        { cache: "no-store" }
      );

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(
          payload?.message || `Erreur serveur (${response.status})`
        );
      }

      setEntry(payload?.data?.lore ?? null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger cette chronique."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#08130d] p-8 text-center text-[#9eb09f]">
        Ouverture du manuscrit...
      </main>
    );
  }

  if (error || !entry) {
    return (
      <main className="min-h-screen bg-[#08130d] p-8 text-center text-[#f5ead0]">
        <h1 className="text-3xl font-bold">Chronique introuvable</h1>
        <p className="mt-3 text-[#a9b9aa]">{error}</p>
        <a
          href="/lore"
          className="mt-6 inline-block rounded-lg bg-[#b48735] px-5 py-3 font-bold"
        >
          Retour à la bibliothèque
        </a>
      </main>
    );
  }

  return <LoreReader entry={entry} />;
}
