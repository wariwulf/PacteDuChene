"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import LoreLibrary from "@/components/lore/LoreLibrary";
import type { LoreEntry } from "@/components/lore/LoreLibraryTypes";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function LorePage() {
  const searchParams = useSearchParams();
  const requestedCategory = searchParams.get("category");

  const [entries, setEntries] = useState<LoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadLore() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/lore`, {
        cache: "no-store",
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok || payload?.success === false) {
        throw new Error(
          payload?.message || `Erreur serveur (${response.status})`,
        );
      }

      setEntries(
        Array.isArray(payload?.data?.lore) ? payload.data.lore : [],
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger le lore.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLore();
  }, []);

  if (loading) {
    return (
      <main className="pacte-lore-page">
        <div className="pacte-lore-status">
          Ouverture des archives...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="pacte-lore-page">
        <div className="pacte-lore-status pacte-lore-status--error">
          <h1>Les archives sont momentanément fermées</h1>
          <p>{error}</p>
          <button type="button" onClick={loadLore}>
            Réessayer
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="pacte-lore-page">
      <div className="pacte-lore-page__container">
        <LoreLibrary
          entries={entries}
          selectedCategory={requestedCategory}
        />
      </div>
    </main>
  );
}
