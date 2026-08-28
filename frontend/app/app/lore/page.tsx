"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

interface LoreEntry {
  loreId: string;
  title: string;
  category: string;
  summary?: string;
  content: string;
  enabled: boolean;
  order: number;
}

type BookStyle =
  | "green"
  | "red"
  | "blue"
  | "purple"
  | "brown"
  | "teal"
  | "slate";

interface LoreCategory {
  key: string;
  label: string;
  style: BookStyle;
  icon: React.ReactNode;
}

const categories: LoreCategory[] = [
  {
    key: "Histoire",
    label: "Histoire",
    style: "green",
    icon: (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M32 52V28M32 34C22 31 15 24 13 14c10 0 18 4 19 14M32 39c10-2 17-9 19-19-10 0-17 4-19 14" />
      </svg>
    ),
  },
  {
    key: "Traditions",
    label: "Traditions",
    style: "red",
    icon: (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M12 43c13-2 17-9 21-21 8-1 15 3 19 10-5 7-12 11-23 11H12Z" />
        <path d="M25 34c8-8 14-11 23-12M37 22l6-7" />
      </svg>
    ),
  },
  {
    key: "Institutions",
    label: "Institutions",
    style: "blue",
    icon: (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M10 51h44M14 48V27l18-11 18 11v21M25 48V35h14v13M30 27h4" />
      </svg>
    ),
  },
  {
    key: "Personnages",
    label: "Personnages",
    style: "purple",
    icon: (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M12 19l6 22h28l6-22-12 7-7-12-7 12-14-7ZM18 49h28" />
      </svg>
    ),
  },
  {
    key: "Chroniques",
    label: "Chroniques",
    style: "brown",
    icon: (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M18 12h28v40H18c-4 0-6-3-6-6V18c0-3 2-6 6-6ZM18 42h28M23 22h15M23 29h11" />
      </svg>
    ),
  },
  {
    key: "Territoires",
    label: "Territoires",
    style: "teal",
    icon: (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M12 17l14-5 12 5 14-5v35l-14 5-12-5-14 5V17ZM26 12v35M38 17v35" />
        <path d="M29 27l6-5 5 6-7 6-5-4" />
      </svg>
    ),
  },
  {
    key: "Autre",
    label: "Autre",
    style: "slate",
    icon: (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M18 18c7-7 12 1 14 5 2-4 7-12 14-5 7 7-1 12-5 14 4 2 12 7 5 14-7 7-12-1-14-5-2 4-7 12-14 5-7-7 1-12 5-14-4-2-12-7-5-14Z" />
      </svg>
    ),
  },
];

function categoryEntries(entries: LoreEntry[], key: string) {
  return entries
    .filter((entry) => entry.enabled && entry.category === key)
    .sort((a, b) => a.order - b.order);
}

export default function LorePage() {
  const [entries, setEntries] = useState<LoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  async function loadLore() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/lore`);

      if (!response.ok) {
        throw new Error(`Erreur serveur (${response.status})`);
      }

      const payload = await response.json();
      setEntries(
        Array.isArray(payload?.data?.lore) ? payload.data.lore : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger le lore."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLore();
  }, []);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.key === openCategory) ?? null,
    [openCategory]
  );

  const selectedEntries = selectedCategory
    ? categoryEntries(entries, selectedCategory.key)
    : [];

  return (
    <main className="pacte-lore-page">
      <div className="pacte-lore-page__backdrop" aria-hidden="true" />

      <div className="pacte-lore-page__container">
        <section className="pacte-library">
          <header className="pacte-library__header">
            <div className="pacte-library__crest">
              <span>✦</span>
              LE PACTE DU CHÊNE
              <span>✦</span>
            </div>

            <h1>La Bibliothèque</h1>

            <p>
              Les mémoires du Pacte, conservées sous le regard du Chêne.
            </p>
          </header>

          <section className="pacte-bookshelf" aria-label="Archives du Pacte">
            <div className="pacte-bookshelf__plaque">
              <span />
              <strong>✦ ARCHIVES DU PACTE ✦</strong>
              <span />
            </div>

            {loading && (
              <div className="pacte-lore-status">
                Chargement des archives...
              </div>
            )}

            {error && (
              <div className="pacte-lore-status pacte-lore-status--error">
                <h2>Les archives sont momentanément fermées</h2>
                <p>{error}</p>
                <button type="button" onClick={loadLore}>
                  Réessayer
                </button>
              </div>
            )}

            {!loading && !error && (
              <>
                <div className="pacte-bookshelf__row pacte-bookshelf__row--top">
                  {categories.slice(0, 4).map((category, index) => {
                    const count = categoryEntries(entries, category.key).length;
                    const active = openCategory === category.key;

                    return (
                      <button
                        key={category.key}
                        type="button"
                        className={`pacte-book pacte-book--${category.style} pacte-book--${index + 1} ${
                          active ? "pacte-book--active" : ""
                        }`}
                        onClick={() =>
                          setOpenCategory(active ? null : category.key)
                        }
                        aria-expanded={active}
                      >
                        <span className="pacte-book__binding" />
                        <span className="pacte-book__ornament">✦</span>
                        <span className="pacte-book__medallion">
                          <span className="pacte-book__icon">
                            {category.icon}
                          </span>
                        </span>
                        <strong>{category.label}</strong>
                        <small>
                          {count} chronique{count > 1 ? "s" : ""}
                        </small>
                        <span className="pacte-book__ornament">✦</span>
                      </button>
                    );
                  })}
                </div>

                <div className="pacte-shelf">
                  <i />
                  <i />
                </div>

                <div className="pacte-bookshelf__row pacte-bookshelf__row--bottom">
                  {categories.slice(4).map((category, index) => {
                    const count = categoryEntries(entries, category.key).length;
                    const active = openCategory === category.key;

                    return (
                      <button
                        key={category.key}
                        type="button"
                        className={`pacte-book pacte-book--${category.style} pacte-book--${
                          index + 5
                        } ${active ? "pacte-book--active" : ""}`}
                        onClick={() =>
                          setOpenCategory(active ? null : category.key)
                        }
                        aria-expanded={active}
                      >
                        <span className="pacte-book__binding" />
                        <span className="pacte-book__ornament">✦</span>
                        <span className="pacte-book__medallion">
                          <span className="pacte-book__icon">
                            {category.icon}
                          </span>
                        </span>
                        <strong>{category.label}</strong>
                        <small>
                          {count} chronique{count > 1 ? "s" : ""}
                        </small>
                        <span className="pacte-book__ornament">✦</span>
                      </button>
                    );
                  })}
                </div>

                <div className="pacte-shelf pacte-shelf--lower">
                  <i />
                  <i />
                </div>

                <div className="pacte-bookshelf__feet">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
              </>
            )}
          </section>

          <div className="pacte-library__hint">
            <span>✦</span>
            <span>Choisissez un ouvrage pour consulter les chroniques qu&apos;il renferme.</span>
            <span>✦</span>
          </div>

          {selectedCategory && (
            <section className="pacte-open-book" aria-label={`Registre ${selectedCategory.label}`}>
              <div className="pacte-open-book__cover">
                <div className="pacte-open-book__cover-inner">
                  <span className="pacte-open-book__icon">
                    {selectedCategory.icon}
                  </span>
                  <span>REGISTRE DU PACTE</span>
                  <h2>{selectedCategory.label}</h2>
                  <i />
                  <p>
                    {selectedEntries.length} chronique
                    {selectedEntries.length > 1 ? "s" : ""} conservée
                    {selectedEntries.length > 1 ? "s" : ""} sous ce sceau.
                  </p>
                </div>
              </div>

              <div className="pacte-open-book__pages">
                <div className="pacte-open-book__heading">
                  <span>✦</span>
                  <h3>Chroniques du registre</h3>
                  <span>✦</span>
                </div>

                {selectedEntries.length === 0 ? (
                  <p className="pacte-open-book__empty">
                    Ce registre ne contient encore aucune chronique.
                  </p>
                ) : (
                  selectedEntries.map((entry, index) => (
                    <article className="pacte-chronicle" key={entry.loreId}>
                      <div className="pacte-chronicle__number">
                        {String(index + 1).padStart(2, "0")}
                      </div>

                      <div>
                        <span>CHRONIQUE</span>
                        <h4>{entry.title}</h4>
                        {entry.summary && <p>{entry.summary}</p>}
                        <Link href={`/lore/${encodeURIComponent(entry.loreId)}`}>
                          Lire la chronique →
                        </Link>
                      </div>
                    </article>
                  ))
                )}

                <button
                  type="button"
                  className="pacte-open-book__close"
                  onClick={() => setOpenCategory(null)}
                >
                  ← Refermer le registre
                </button>
              </div>
            </section>
          )}
        </section>
      </div>
    </main>
  );
}
