"use client";

import Link from "next/link";
import { getCategory } from "./LoreIcons";
import type { LoreEntry } from "./LoreLibraryTypes";

export default function LoreReader({ entry }: { entry: LoreEntry }) {
  const meta = getCategory(entry.category);
  const Icon = meta.icon;

  const paragraphs = entry.content
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <main className="lore-reader-page">
      <div className="lore-reader-page__ambient" />

      <div className="lore-reader-page__container">
        <Link href="/lore" className="lore-reader-page__back">
          <span>←</span> Retour à la bibliothèque
        </Link>

        <article className="lore-manuscript">
          <div className="lore-manuscript__corner lore-manuscript__corner--tl">✦</div>
          <div className="lore-manuscript__corner lore-manuscript__corner--tr">✦</div>
          <div className="lore-manuscript__corner lore-manuscript__corner--bl">✦</div>
          <div className="lore-manuscript__corner lore-manuscript__corner--br">✦</div>

          <div className="lore-manuscript__cover-line" />

          <header className="lore-manuscript__header">
            <div className="lore-manuscript__category">
              <Icon />
              <span>{entry.category}</span>
            </div>

            <div className="lore-manuscript__ornament">
              <span />
              <b>✦</b>
              <span />
            </div>

            <h1>{entry.title}</h1>

            {entry.summary && <p>{entry.summary}</p>}
          </header>

          <div className="lore-manuscript__rule">
            <span>✧</span>
            <i />
            <span>✧</span>
          </div>

          <div className="lore-manuscript__content">
            {paragraphs.map((paragraph, index) => (
              <p
                key={`${entry.loreId}-${index}`}
                className={index === 0 ? "lore-manuscript__paragraph--first" : ""}
              >
                {index === 0 && <span className="lore-manuscript__dropcap">{paragraph.charAt(0)}</span>}
                {index === 0 ? paragraph.slice(1) : paragraph}
              </p>
            ))}
          </div>

          <footer className="lore-manuscript__footer">
            <span>✦</span>
            <span>LE PACTE DU CHÊNE</span>
            <span>✦</span>
          </footer>

          <div className="lore-manuscript__cover-line lore-manuscript__cover-line--bottom" />
        </article>

        <div className="lore-reader-page__seal" aria-hidden="true">
          <span>✦</span>
          <span>SOUS LE CHÊNE, LA MÉMOIRE DEMEURE</span>
          <span>✦</span>
        </div>
      </div>
    </main>
  );
}
