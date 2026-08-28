"use client";

import Link from "next/link";
import { getCategory, LORE_CATEGORIES } from "./LoreIcons";
import type { LoreEntry } from "./LoreLibraryTypes";

type LoreCategoryId = (typeof LORE_CATEGORIES)[number]["id"];

interface LoreLibraryProps {
  entries: LoreEntry[];
  selectedCategory?: string | null;
}

function categoryEntries(entries: LoreEntry[], category: string) {
  return [...entries]
    .filter(
      (entry) =>
        entry.enabled &&
        entry.category.toLowerCase() === category.toLowerCase(),
    )
    .sort(
      (a, b) =>
        a.order - b.order ||
        a.title.localeCompare(b.title, "fr"),
    );
}

function Book({
  category,
  index,
  entries,
}: {
  category: (typeof LORE_CATEGORIES)[number];
  index: number;
  entries: LoreEntry[];
}) {
  const count = entries.length;
  const Icon = category.icon;

  return (
    <Link
      href={`/lore?category=${encodeURIComponent(category.id)}#registre`}
      className={`pacte-book pacte-book--${category.accent} pacte-book--${
        index + 1
      }`}
      aria-label={`Ouvrir le registre ${category.label}`}
    >
      <span className="pacte-book__binding" />
      <span className="pacte-book__ornament">✦</span>

      <span className="pacte-book__medallion">
        <span className="pacte-book__icon">
          <Icon />
        </span>
      </span>

      <strong>{category.label}</strong>

      <small>
        {count === 0
          ? "Aucune chronique"
          : count === 1
            ? "1 chronique"
            : `${count} chroniques`}
      </small>

      <span className="pacte-book__ornament">✦</span>
    </Link>
  );
}

function Registry({
  category,
  entries,
}: {
  category: (typeof LORE_CATEGORIES)[number];
  entries: LoreEntry[];
}) {
  const Icon = category.icon;

  return (
    <section
      id="registre"
      className="pacte-open-book"
      aria-label={`Registre ${category.label}`}
    >
      <div className="pacte-open-book__cover">
        <div className="pacte-open-book__cover-inner">
          <span className="pacte-open-book__icon">
            <Icon />
          </span>

          <span>REGISTRE DU PACTE</span>

          <h2>{category.label}</h2>
          <i />

          <p>
            {entries.length === 0
              ? "Aucune chronique conservée sous ce sceau."
              : entries.length === 1
                ? "1 chronique conservée sous ce sceau."
                : `${entries.length} chroniques conservées sous ce sceau.`}
          </p>
        </div>
      </div>

      <div className="pacte-open-book__pages">
        <div className="pacte-open-book__heading">
          <span>✦</span>
          <h3>Chroniques du registre</h3>
          <span>✦</span>
        </div>

        {entries.length === 0 ? (
          <p className="pacte-open-book__empty">
            Ce registre ne contient encore aucune chronique.
          </p>
        ) : (
          entries.map((entry, index) => (
            <article className="pacte-chronicle" key={entry.loreId}>
              <span className="pacte-chronicle__number">
                {String(index + 1).padStart(2, "0")}
              </span>

              <div>
                <span>Chronique</span>
                <h4>{entry.title}</h4>

                {entry.summary && <p>{entry.summary}</p>}

                <Link
                  href={`/lore/${encodeURIComponent(entry.loreId)}`}
                >
                  Lire la chronique →
                </Link>
              </div>
            </article>
          ))
        )}

        <Link href="/lore" className="pacte-open-book__close">
          ← Refermer le registre
        </Link>
      </div>
    </section>
  );
}

export default function LoreLibrary({
  entries,
  selectedCategory = null,
}: LoreLibraryProps) {
  const normalizedCategory = selectedCategory?.trim() ?? "";

  const activeCategory =
    (LORE_CATEGORIES.find(
      (category) =>
        category.id.toLowerCase() === normalizedCategory.toLowerCase(),
    ) as (typeof LORE_CATEGORIES)[number] | undefined) ?? null;

  const topCategories = LORE_CATEGORIES.slice(0, 4);
  const bottomCategories = LORE_CATEGORIES.slice(4);

  return (
    <div className="pacte-library">
      <div className="pacte-library__scene">
        <div className="pacte-bookshelf" aria-label="Archives du Pacte">
          <div className="pacte-bookshelf__row pacte-bookshelf__row--top">
            {topCategories.map((category, index) => (
              <Book
                key={category.id}
                category={category}
                index={index}
                entries={categoryEntries(entries, category.id)}
              />
            ))}
          </div>

          <div className="pacte-bookshelf__row pacte-bookshelf__row--bottom">
            {bottomCategories.map((category, index) => (
              <Book
                key={category.id}
                category={category}
                index={index + 4}
                entries={categoryEntries(entries, category.id)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="pacte-library__hint">
        <span>✦</span>
        <span>
          Choisissez un ouvrage pour consulter les chroniques qu’il renferme.
        </span>
        <span>✦</span>
      </div>

      {activeCategory && (
        <Registry
          category={activeCategory}
          entries={categoryEntries(entries, activeCategory.id)}
        />
      )}
    </div>
  );
}
