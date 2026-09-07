"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import type { CSSProperties } from "react";
import AmbientMusic from "@/components/AmbientMusic";
import { LORE_CATEGORIES } from "./LoreIcons";
import type { LoreEntry } from "./LoreLibraryTypes";

interface LoreLibraryProps {
  entries: LoreEntry[];
  selectedCategory?: string | null;
}

type LoreCategory = (typeof LORE_CATEGORIES)[number];
type BookPage = string[];
type ReaderMode = "toc" | "story";

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
  onOpen,
}: {
  category: LoreCategory;
  index: number;
  entries: LoreEntry[];
  onOpen: (category: LoreCategory, element: HTMLButtonElement) => void;
}) {
  const count = entries.length;

  return (
    <button
      type="button"
      className={`pacte-book pacte-book--${category.accent} pacte-book--${index + 1}`}
      aria-label={`Ouvrir le registre ${category.label}`}
      onClick={(event) => onOpen(category, event.currentTarget)}
    >
      <span className="pacte-book__image-wrap" aria-hidden="true">
        <img
          src={category.bookImage}
          alt=""
          className="pacte-book__image"
          draggable={false}
        />
      </span>

      <span className="pacte-book__count" aria-hidden="true">
        {count === 0
          ? "Aucune chronique"
          : count === 1
            ? "1 chronique"
            : `${count} chroniques`}
      </span>
    </button>
  );
}

function splitParagraphs(content: string) {
  return content
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function measureLines(
  text: string,
  width: number,
  font: string,
  firstLineExtraWidth = 0,
) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context || !text) return 1;

  context.font = font;
  const words = text.split(/\s+/).filter(Boolean);
  let lines = 1;
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    const availableWidth = lines === 1 ? width - firstLineExtraWidth : width;

    if (line && context.measureText(candidate).width > availableWidth) {
      lines += 1;
      line = word;
    } else {
      line = candidate;
    }
  }

  return lines;
}

function paginateParagraphs(
  paragraphs: string[],
  width: number,
  firstPageHeight: number,
  pageHeight: number,
  font: string,
  lineHeight: number,
  paragraphGap: number,
  dropcapWidth: number,
) {
  const pages: BookPage[] = [];
  let current: string[] = [];
  let remaining = firstPageHeight;

  const pushPage = () => {
    if (current.length > 0) pages.push(current);
    current = [];
    remaining = pageHeight;
  };

  for (let paragraphIndex = 0; paragraphIndex < paragraphs.length; paragraphIndex += 1) {
    let remainingText = paragraphs[paragraphIndex];
    let firstChunk = true;

    while (remainingText) {
      const extraFirstLineWidth =
        paragraphIndex === 0 && firstChunk ? dropcapWidth : 0;
      const maxLines = Math.max(
        1,
        Math.floor((remaining - paragraphGap) / lineHeight),
      );

      const words = remainingText.split(/\s+/).filter(Boolean);
      let bestCount = 0;
      let bestLines = 0;

      for (let count = 1; count <= words.length; count += 1) {
        const candidate = words.slice(0, count).join(" ");
        const lines = measureLines(
          candidate,
          width,
          font,
          extraFirstLineWidth,
        );

        if (lines <= maxLines) {
          bestCount = count;
          bestLines = lines;
        } else {
          break;
        }
      }

      if (bestCount === 0) {
        if (current.length > 0) {
          pushPage();
          firstChunk = false;
          continue;
        }

        bestCount = 1;
        bestLines = measureLines(words[0], width, font, extraFirstLineWidth);
      }

      const chunk = words.slice(0, bestCount).join(" ");
      current.push(chunk);
      remaining -= bestLines * lineHeight + paragraphGap;
      remainingText = words.slice(bestCount).join(" ");
      firstChunk = false;

      if (remainingText) pushPage();
    }
  }

  if (current.length > 0) pages.push(current);
  return pages.length > 0 ? pages : [[]];
}

function splitToc(entries: LoreEntry[], perPage = 7) {
  const pages: LoreEntry[][] = [];
  for (let index = 0; index < entries.length; index += perPage) {
    pages.push(entries.slice(index, index + perPage));
  }
  return pages.length ? pages : [[]];
}

function OpenBook({
  category,
  entries,
  onClose,
}: {
  category: LoreCategory;
  entries: LoreEntry[];
  onClose: () => void;
}) {
  const Icon = category.icon;
  const [mode, setMode] = useState<ReaderMode>("toc");
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [pages, setPages] = useState<BookPage[]>([[]]);
  const [tocPages, setTocPages] = useState<LoreEntry[][]>([[]]);
  const [spread, setSpread] = useState(0);
  const [bookElement, setBookElement] = useState<HTMLDivElement | null>(null);

  const activeEntry =
    entries.find((entry) => entry.loreId === activeEntryId) ?? null;
  const paragraphs = activeEntry ? splitParagraphs(activeEntry.content) : [];

  // La première double-page est une page de garde dédiée à la chronique.
  // Le texte commence ensuite sur la double-page suivante.
  const storyPageOffset = Math.max(0, spread - 1);
  const firstPage =
    mode === "story" && spread > 0 ? pages[storyPageOffset * 2] ?? [] : [];
  const secondPage =
    mode === "story" && spread > 0 ? pages[storyPageOffset * 2 + 1] ?? [] : [];
  const storyTextSpreads = Math.max(1, Math.ceil(pages.length / 2));
  const storySpreads = 1 + storyTextSpreads;
  const tocSpreads = Math.max(1, tocPages.length);

  useEffect(() => {
    setMode("toc");
    setActiveEntryId(null);
    setSpread(0);
    setPages([[]]);
    setTocPages(splitToc(entries));
  }, [category.id]);

  useEffect(() => {
    setSpread(0);
  }, [mode, activeEntryId]);

  useLayoutEffect(() => {
    if (!bookElement || !activeEntry || mode !== "story") return;

    const paginate = () => {
      const content = bookElement.querySelector<HTMLElement>(
        ".pacte-open-book-modal__content--measure",
      );
      if (!content) return;

      const width = content.clientWidth;
      const firstPageHeight = content.clientHeight;
      const rootFontSize =
        parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const computed = getComputedStyle(content);
      const fontSize = parseFloat(computed.fontSize) || 13;
      const lineHeight = parseFloat(computed.lineHeight) || fontSize * 1.58;
      const paragraphGap = rootFontSize * 0.65;
      const font = `${computed.fontWeight} ${fontSize}px ${computed.fontFamily}`;
      const dropcapWidth = Math.min(70, width * 0.16);
      const regularPageHeight = content.clientHeight;

      const nextPages = paginateParagraphs(
        paragraphs,
        width,
        firstPageHeight,
        regularPageHeight,
        font,
        lineHeight,
        paragraphGap,
        dropcapWidth,
      );

      setPages(nextPages);
      setSpread((current) =>
        Math.min(current, Math.max(0, 1 + Math.ceil(nextPages.length / 2))),
      );
    };

    paginate();
    const observer = new ResizeObserver(paginate);
    observer.observe(bookElement);
    window.addEventListener("resize", paginate);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", paginate);
    };
  }, [bookElement, activeEntry, mode, paragraphs.join("\n\n")]);

  const tocPageRight = tocPages[spread] ?? [];

  function chooseEntry(entry: LoreEntry) {
    setActiveEntryId(entry.loreId);
    setMode("story");
    setSpread(0);
  }

  function startFromBeginning() {
    if (!entries[0]) return;
    chooseEntry(entries[0]);
  }

  function continueReader() {
    if (mode === "toc") {
      if (spread < tocSpreads - 1) {
        setSpread((value) => value + 1);
      } else {
        startFromBeginning();
      }
      return;
    }

    if (spread < storySpreads - 1) {
      setSpread((value) => value + 1);
      return;
    }

    if (!activeEntry) return;
    const currentIndex = entries.findIndex(
      (entry) => entry.loreId === activeEntry.loreId,
    );
    const nextEntry = entries[currentIndex + 1];
    if (nextEntry) chooseEntry(nextEntry);
  }

  const canContinue =
    mode === "toc"
      ? entries.length > 0
      : spread < storySpreads - 1 ||
        Boolean(
          activeEntry &&
            entries[
              entries.findIndex((entry) => entry.loreId === activeEntry.loreId) + 1
            ],
        );

  function goPrevious() {
    if (mode !== "story") return;

    if (spread > 1) {
      setSpread((value) => value - 1);
      return;
    }

    if (spread === 1) {
      setSpread(0);
      return;
    }

    setMode("toc");
    setSpread(0);
  }

  return (
    <div
      className="pacte-open-book-modal"
      role="dialog"
      aria-modal="true"
      aria-label={`Registre ${category.label}`}
    >
      <button
        type="button"
        className="pacte-open-book-modal__backdrop"
        aria-label="Fermer le registre"
        onClick={onClose}
      />

      <div
        ref={setBookElement}
        className="pacte-open-book-modal__book pacte-open-book-modal__book--reader"
      >
        <img
          src="/images/lore/books/open-book.png"
          alt=""
          className="pacte-open-book-modal__image"
          draggable={false}
        />

        {mode === "toc" ? (
          <>
            <div className="pacte-open-book-modal__page pacte-open-book-modal__page--left pacte-open-book-modal__toc-page">
              <header className="pacte-open-book-modal__header pacte-open-book-modal__header--toc">
                <div className="pacte-open-book-modal__category">
                  <Icon />
                  <span>Archives du Pacte</span>
                </div>
                <h2>{category.label}</h2>
                <div className="pacte-open-book-modal__ornament">
                  <span />
                  <b>✦</b>
                  <span />
                </div>
              </header>
            </div>

            <div className="pacte-open-book-modal__page pacte-open-book-modal__page--right pacte-open-book-modal__toc-page">
              <header className="pacte-open-book-modal__header pacte-open-book-modal__header--toc pacte-open-book-modal__toc-header-right">
                <h2>Sommaire</h2>
                <div className="pacte-open-book-modal__ornament">
                  <span />
                  <b>✦</b>
                  <span />
                </div>
              </header>

              <div className="pacte-open-book-modal__toc-list pacte-open-book-modal__toc-list--page pacte-open-book-modal__toc-list--handwritten">
                {tocPageRight.map((entry, index) => (
                  <button
                    key={entry.loreId}
                    type="button"
                    onClick={() => chooseEntry(entry)}
                  >
                    <span>{String(spread * 14 + index + 1).padStart(2, "0")}</span>
                    <strong>{entry.title}</strong>
                  </button>
                ))}
              </div>

              <div className="pacte-open-book-modal__toc-hint">
                <span>Choisissez une chronique</span>
                <small>ou utilisez la flèche pour commencer par le début</small>
              </div>
            </div>
          </>
        ) : activeEntry ? (
          <>
            {spread === 0 ? (
              <>
                <div className="pacte-open-book-modal__page pacte-open-book-modal__page--left">
                  <div className="flex h-full flex-col items-center px-[8%] py-[4%] text-center">
                    <div className="pacte-open-book-modal__category">
                      <Icon />
                      <span>Archives du Pacte</span>
                    </div>
                    <h2 className="mt-2 text-[clamp(1.45rem,2.5vw,2.35rem)] leading-tight">
                      {activeEntry.title}
                    </h2>
                    <div className="pacte-open-book-modal__ornament my-3">
                      <span />
                      <b>✦</b>
                      <span />
                    </div>

                    {activeEntry.imageUrl ? (
                      <div className="flex min-h-0 flex-1 w-full items-center justify-center py-2">
                        <img
                          src={activeEntry.imageUrl}
                          alt={`Illustration de ${activeEntry.title}`}
                          className="max-h-full max-w-[88%] rounded-sm object-contain shadow-[0_8px_18px_rgba(55,34,12,0.25)]"
                          draggable={false}
                        />
                      </div>
                    ) : (
                      <div className="flex min-h-0 flex-1 w-full items-center justify-center py-8">
                        <span className="text-[0.72rem] uppercase tracking-[0.22em] text-[#80623b]/70">
                          Chronique du Pacte
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Zone invisible conservée pour mesurer la pagination du texte. */}
                  <div
                    className="pacte-open-book-modal__content pacte-open-book-modal__content--measure absolute inset-x-0 bottom-0 top-0 opacity-0 pointer-events-none"
                    aria-hidden="true"
                  >
                    {paragraphs.map((paragraph, index) => (
                      <p key={`${activeEntry.loreId}-measure-${index}`}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="pacte-open-book-modal__page pacte-open-book-modal__page--right">
                  <div className="flex h-full flex-col items-center justify-center px-[10%] text-center">
                    {activeEntry.summary ? (
                      <p className="max-w-[88%] text-[clamp(0.85rem,1.2vw,1.08rem)] italic leading-relaxed text-[#59452f]">
                        {activeEntry.summary}
                      </p>
                    ) : (
                      <p className="max-w-[80%] text-[0.7rem] uppercase tracking-[0.2em] text-[#80623b]/70">
                        Sous le Chêne, la mémoire demeure.
                      </p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="pacte-open-book-modal__page pacte-open-book-modal__page--left">
                  <div className="pacte-open-book-modal__content">
                    {firstPage.map((paragraph, index) => (
                      <p
                        key={`${activeEntry.loreId}-left-${index}-${spread}`}
                        className={index === 0 ? "pacte-open-book-modal__paragraph--first" : ""}
                      >
                        {storyPageOffset === 0 && index === 0 && (
                          <span className="pacte-open-book-modal__dropcap">
                            {paragraph.charAt(0)}
                          </span>
                        )}
                        {storyPageOffset === 0 && index === 0
                          ? paragraph.slice(1)
                          : paragraph}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="pacte-open-book-modal__page pacte-open-book-modal__page--right">
                  <div className="pacte-open-book-modal__content">
                    {secondPage.map((paragraph, index) => (
                      <p key={`${activeEntry.loreId}-right-${index}-${spread}`}>
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  <footer className="pacte-open-book-modal__footer">
                    <span>✦</span>
                    <span>{category.label}</span>
                    <span>✦</span>
                  </footer>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="pacte-open-book-modal__empty">
            Ce registre ne contient encore aucune chronique.
          </div>
        )}

        {mode === "story" && (
          <button
            type="button"
            className="pacte-open-book-modal__previous"
            onClick={goPrevious}
            aria-label={
              spread > 0 ? "Page précédente" : "Revenir au sommaire"
            }
          >
            <img
              src="/images/pacte/carousel-arrow-left.png"
              alt=""
              draggable={false}
            />
          </button>
        )}

        {canContinue && (
          <button
            type="button"
            className="pacte-open-book-modal__next"
            onClick={continueReader}
            aria-label={
              mode === "toc" ? "Commencer la lecture" : "Continuer la lecture"
            }
          >
            <img
              src="/images/pacte/carousel-arrow-right.png"
              alt=""
              draggable={false}
            />
          </button>
        )}

        {mode === "story" && (
          <button
            type="button"
            className="pacte-open-book-modal__toc-back"
            onClick={() => {
              setMode("toc");
              setSpread(0);
            }}
          >
            Sommaire
          </button>
        )}

        <div className="pacte-open-book-modal__page-indicator" aria-live="polite">
          {mode === "toc"
            ? `Sommaire${tocSpreads > 1 ? ` · ${spread + 1}/${tocSpreads}` : ""}`
            : spread === 0
              ? "Page de garde"
              : `${storyPageOffset * 2 + 1}–${Math.min(
                  storyPageOffset * 2 + 2,
                  pages.length,
                )} / ${pages.length}`}
        </div>

        <button
          type="button"
          className="pacte-open-book-modal__close"
          onClick={onClose}
          aria-label="Refermer le registre"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default function LoreLibrary({
  entries,
  selectedCategory = null,
}: LoreLibraryProps) {
  const normalizedCategory = selectedCategory?.trim() ?? "";

  const initialCategory =
    LORE_CATEGORIES.find(
      (category) =>
        category.id.toLowerCase() === normalizedCategory.toLowerCase(),
    ) ?? null;

  const [activeCategory, setActiveCategory] = useState<LoreCategory | null>(
    initialCategory,
  );
  const [openingCategory, setOpeningCategory] = useState<LoreCategory | null>(
    null,
  );
  const [openingStyle, setOpeningStyle] = useState<CSSProperties>();

  useEffect(() => {
    const category =
      LORE_CATEGORIES.find(
        (item) =>
          item.id.toLowerCase() === normalizedCategory.toLowerCase(),
      ) ?? null;

    setActiveCategory(category);
  }, [normalizedCategory]);

  useEffect(() => {
    if (!activeCategory) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRegistry();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeCategory]);

  function updateUrl(category: LoreCategory | null) {
    const url = category
      ? `/lore?category=${encodeURIComponent(category.id)}`
      : "/lore";

    window.history.replaceState({}, "", url);
  }

  function openBook(category: LoreCategory, element: HTMLButtonElement) {
    const rect = element.getBoundingClientRect();
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;

    setOpeningStyle({
      "--book-start-x": `${startX - centerX}px`,
      "--book-start-y": `${startY - centerY}px`,
      "--book-start-scale": "0.28",
    } as CSSProperties);
    setOpeningCategory(category);
    updateUrl(category);
  }

  function closeRegistry() {
    setActiveCategory(null);
    updateUrl(null);
  }

  useEffect(() => {
    if (!openingCategory) return;

    const timer = window.setTimeout(() => {
      setActiveCategory(openingCategory);
      setOpeningCategory(null);
    }, 900);

    return () => window.clearTimeout(timer);
  }, [openingCategory]);

  const topCategories = LORE_CATEGORIES.slice(0, 4);
  const bottomCategories = LORE_CATEGORIES.slice(4);

  return (
    <div className="pacte-library">
      <AmbientMusic src="/audio/ambientlore.m4a" />
      <div className="pacte-library__scene">
        <div className="pacte-bookshelf" aria-label="Archives du Pacte">
          <div className="pacte-bookshelf__row pacte-bookshelf__row--top">
            {topCategories.map((category, index) => (
              <Book
                key={category.id}
                category={category}
                index={index}
                entries={categoryEntries(entries, category.id)}
                onOpen={openBook}
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
                onOpen={openBook}
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
        <OpenBook
          category={activeCategory}
          entries={categoryEntries(entries, activeCategory.id)}
          onClose={closeRegistry}
        />
      )}

      {openingCategory && (
        <div
          className="pacte-book-opening"
          aria-live="polite"
          aria-label={`Ouverture du registre ${openingCategory.label}`}
        >
          <div className="pacte-book-opening__book" style={openingStyle}>
            <img
              src={openingCategory.bookImage}
              alt=""
              className="pacte-book-opening__image"
              draggable={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}
