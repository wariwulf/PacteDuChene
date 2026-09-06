"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface NewsArticle {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: "COMMUNAUTE" | "EVENEMENT" | "PACTE" | "ANNONCE";
  image?: string;
  published: boolean;
  featured: boolean;
  publishedAt?: string;
  createdAt: string;
}

interface NewsResponse {
  success: boolean;
  data?: {
    news?: NewsArticle;
  };
  message?: string;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const CATEGORY_LABELS: Record<NewsArticle["category"], string> = {
  COMMUNAUTE: "Communauté",
  EVENEMENT: "Événement",
  PACTE: "Pacte",
  ANNONCE: "Annonce",
};

function formatDate(date?: string) {
  if (!date) return "";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export default function ActualiteDetailPage() {
  const params = useParams();

  const slug =
    typeof params?.slug === "string"
      ? params.slug
      : Array.isArray(params?.slug)
        ? params.slug[0]
        : "";

  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadArticle() {
    if (!slug) {
      setError("Actualité introuvable.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/news/${encodeURIComponent(slug)}`,
        { cache: "no-store" },
      );

      const payload: NewsResponse = await response.json();

      if (!response.ok || !payload.success || !payload.data?.news) {
        throw new Error(
          payload.message || `Erreur serveur (${response.status})`,
        );
      }

      setArticle(payload.data.news);
    } catch (err) {
      console.error("Erreur chargement actualité :", err);

      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger cette actualité.",
      );

      setArticle(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadArticle();
  }, [slug]);

  const pageStyle = {
    backgroundImage:
      "linear-gradient(rgba(3,8,5,.18), rgba(3,8,5,.34)), url('/images/news-board-background.png')",
    backgroundSize: "cover",
    backgroundPosition: "center center",
    backgroundAttachment: "fixed" as const,
  };

  if (loading) {
    return (
      <main
        className="min-h-screen bg-[#080d09] text-[#4a3722]"
        style={pageStyle}
      >
        <div className="mx-auto flex min-h-[calc(100vh-70px)] max-w-5xl items-center justify-center px-6 py-16">
          <div className="rounded-md border border-[#9a7438]/60 bg-[#ead7ae]/95 px-8 py-6 text-center text-[#49351d] shadow-2xl">
            <p className="font-serif text-xl">Consultation du registre...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!article) {
    return (
      <main
        className="min-h-screen bg-[#080d09] text-[#4a3722]"
        style={pageStyle}
      >
        <div className="mx-auto max-w-5xl px-6 py-14">
          <Link
            href="/news"
            className="group inline-flex items-center gap-3 rounded-md border border-[#b48742]/70 bg-[#21170e]/90 px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#f0d9a5] shadow-[0_8px_25px_rgba(0,0,0,.38)] transition hover:border-[#e3bd70] hover:bg-[#302114]"
          >
            <span className="text-base transition-transform group-hover:-translate-x-1">
              ←
            </span>
            <span>Retour aux actualités</span>
          </Link>

          <section className="mx-auto mt-10 max-w-2xl rounded-sm border border-[#9b7132]/60 bg-[#ead7ae] p-10 text-center text-[#49351d] shadow-2xl">
            <p className="font-serif text-3xl">Actualité introuvable</p>
            <p className="mt-3 text-sm leading-6">
              {error || "Cette nouvelle n'existe plus ou n'est plus disponible."}
            </p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main
      className="relative min-h-screen overflow-x-hidden bg-[#070c08] text-[#4a3722]"
      style={pageStyle}
    >
      {/* Assombrit légèrement les bords pour donner l'impression d'être
          directement devant le panneau. */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,.16)_72%,rgba(0,0,0,.38)_100%)]" />

      <div className="relative z-10 mx-auto min-h-screen w-full max-w-7xl px-4 pb-24 pt-8 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1120px]">
          {/* Ornement réutilisable : plaque de bois fournie pour les actions de navigation. */}
          <Link
            href="/news"
            aria-label="Retour aux actualités"
            className="group relative ml-0 mt-3 block overflow-hidden transition duration-200 hover:brightness-110"
            style={{
              width: "500px",
              maxWidth: "500px",
              aspectRatio: "1027 / 199",
            }}
          >
            <img
              src="/images/decorations/button.png"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0 block h-full w-full select-none object-fill"
            />
            <img
              src="/images/pacte/carousel-arrow-left.png"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute left-[7%] top-1/2 z-30 h-11 w-auto -translate-y-1/2 object-contain transition-transform duration-200 group-hover:-translate-x-1"
            />
            <span
              className="absolute inset-0 z-10 flex items-center justify-center pb-[1%] pl-[4%] font-serif text-[11px] font-semibold uppercase tracking-[0.13em] text-[#eadb80] transition-transform duration-200 group-hover:-translate-y-0.5"
              style={{
                fontFamily: "var(--font-cinzel), Georgia, serif",
                textShadow: "rgba(0, 0, 0, 0.85) 0px 1px 2px",
              }}
            >
              Retour aux actualités
            </span>
            <img
              src="/images/member/arbre-pacte.png"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute right-[7%] top-1/2 z-30 h-11 w-auto -translate-y-1/2 object-contain opacity-90"
            />
          </Link>

          {/* Le vrai parchemin graphique est utilisé comme support.
              Le contenu HTML reste indépendant de l'image : il est donc
              sélectionnable, responsive et parfaitement pilotable. */}
          <article
            className="relative mx-auto mt-7 w-full max-w-[900px] text-[#3b2816] drop-shadow-[0_24px_55px_rgba(0,0,0,.62)]"
          >
            <img
              src="/images/news-parchment-pinned.png"
              alt=""
              aria-hidden="true"
              className="pointer-events-none relative block h-auto w-full select-none"
            />

            <div
              className="absolute inset-0 z-10"
              style={{
                paddingLeft: "14%",
                paddingRight: "14%",
                paddingTop: "23%",
                paddingBottom: "12%",
              }}
            >
              <header className="text-center">
                <div
                  className="relative mx-auto overflow-hidden"
                  style={{
                    width: "220px",
                    maxWidth: "220px",
                    aspectRatio: "1032 / 205",
                  }}
                >
                  <img
                    src="/images/decorations/cadre.png"
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 block h-full w-full select-none"
                  />
                  <span
                    className="absolute inset-0 z-10 flex items-center justify-center font-serif text-[9px] font-semibold uppercase tracking-[0.24em]"
                    style={{
                      color: "rgba(76, 52, 28, 0.86)",
                      fontFamily: "var(--font-cinzel), Georgia, serif",
                      lineHeight: 1,
                      transform: "translateY(1px)",
                    }}
                  >
                    {CATEGORY_LABELS[article.category]}
                  </span>
                </div>

                <h2
                  className="mx-auto mt-6 max-w-2xl font-serif text-xl font-semibold leading-[1.18] sm:text-2xl md:text-3xl"
                  style={{
                    color: "rgba(55, 38, 21, 0.92)",
                    fontFamily: "var(--font-cinzel), Georgia, serif",
                    textShadow: "0 0 1px rgba(45,28,13,.16)",
                  }}
                >
                  {article.title}
                </h2>

                <div className="mx-auto mt-4 flex max-w-xl items-center justify-center gap-3 font-serif text-[11px] italic sm:text-xs" style={{ color: "rgba(82, 57, 31, 0.82)" }}>
                  <span>{formatDate(article.publishedAt ?? article.createdAt)}</span>
                  <span aria-hidden="true" style={{ color: "rgba(100, 70, 36, 0.62)" }}>
                    ✦
                  </span>
                  <span>Le Pacte du Chêne</span>
                </div>

                <div
                  className="mx-auto mt-4 overflow-hidden"
                  style={{
                    width: "190px",
                    maxWidth: "190px",
                    height: "50px",
                  }}
                  aria-hidden="true"
                >
                  <img
                    src="/images/decorations/separation.png"
                    alt=""
                    className="pointer-events-none block h-auto select-none"
                    style={{
                      width: "190px",
                      maxWidth: "190px",
                    }}
                  />
                </div>

                <p className="mx-auto mt-6 max-w-2xl font-serif text-[15px] italic leading-7 sm:text-[16px] sm:leading-8" style={{ color: "rgba(78, 54, 29, 0.84)" }}>
                  {article.excerpt}
                </p>
              </header>

              {article.image && (
                <figure className="mx-auto mt-9 max-w-4xl overflow-hidden border border-[#765126]/45 bg-[#503719]/10 p-1.5 shadow-[0_10px_25px_rgba(54,36,14,.22)]">
                  <img
                    src={article.image}
                    alt=""
                    className="max-h-[520px] w-full object-cover"
                  />
                </figure>
              )}

              <div className="mx-auto mt-9 h-px max-w-2xl bg-[#6b4b28]/20" aria-hidden="true" />

              <div className="mx-auto mt-8 max-w-2xl">
                <div className="whitespace-pre-wrap font-serif text-[15px] leading-8 sm:text-[16px] sm:leading-9" style={{ color: "rgba(60, 42, 24, 0.86)" }}>
                  {article.content}
                </div>
              </div>

              <footer className="mt-12 text-center" style={{ color: "rgba(91, 62, 33, 0.72)" }}>
                <div
                  className="mx-auto overflow-hidden"
                  style={{
                    width: "150px",
                    maxWidth: "150px",
                    height: "50px",
                  }}
                  aria-hidden="true"
                >
                  <img
                    src="/images/decorations/separation.png"
                    alt=""
                    className="pointer-events-none block h-auto w-full select-none"
                  />
                </div>

                <p className="mt-4 font-serif text-sm italic" style={{ color: "rgba(91, 62, 33, 0.72)" }}>
                  Une nouvelle du Pacte du Chêne
                </p>
              </footer>
            </div>
          </article>
        </div>
      </div>
    </main>
  );
}
