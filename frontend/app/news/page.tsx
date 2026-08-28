"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./news.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type NewsCategory = "COMMUNAUTE" | "EVENEMENT" | "PACTE" | "ANNONCE";

interface NewsArticle {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: NewsCategory;
  image?: string;
  published: boolean;
  featured: boolean;
  publishedAt?: string;
  createdAt: string;
}

const categoryLabels: Record<NewsCategory, string> = {
  COMMUNAUTE: "Communauté",
  EVENEMENT: "Événement",
  PACTE: "Pacte",
  ANNONCE: "Annonce",
};

function formatDate(value?: string) {
  if (!value) return "Date non renseignée";

  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadNews() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/news`, {
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Erreur serveur (${response.status})`);
      }

      const payload = await response.json();
      setNews(Array.isArray(payload?.data?.news) ? payload.data.news : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger les actualités."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNews();
  }, []);

  return (
    <section className={styles.page}>
      <div className={styles.background} aria-hidden="true" />
      <div className={styles.vignette} aria-hidden="true" />

      <div className={styles.content}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Le Pacte du Chêne</p>
            <h1 className={styles.title}>Actualités</h1>
            <p className={styles.subtitle}>
              Les nouvelles, annonces et événements du Pacte.
            </p>
          </div>

          <button onClick={loadNews} className={styles.refreshButton}>
            Actualiser
          </button>
        </header>

        <div className={styles.boardArea}>
          <div className={styles.boardContent}>
            <div className={styles.boardHeading}>
              <span>✦</span>
              <h2>Les nouvelles du Pacte</h2>
              <span>✦</span>
            </div>

            {loading && (
              <div className={styles.status}>
                Chargement des actualités...
              </div>
            )}

            {!loading && error && (
              <div className={`${styles.status} ${styles.error}`}>
                <strong>Impossible de charger les actualités</strong>
                <span>{error}</span>
                <button onClick={loadNews} className={styles.retryButton}>
                  Réessayer
                </button>
              </div>
            )}

            {!loading && !error && news.length === 0 && (
              <div className={styles.status}>
                <span className={styles.emptyIcon}>✦</span>
                <strong>Aucune actualité</strong>
                <span>Le Pacte n&apos;a encore publié aucune actualité.</span>
              </div>
            )}

            {!loading && !error && news.length > 0 && (
              <div className={styles.newsGrid}>
                {news.map((article) => (
                  <article
                    key={article._id}
                    className={`${styles.newsCard} ${
                      article.featured ? styles.featured : ""
                    }`}
                  >
                    <div className={styles.cardTop}>
                      <span className={styles.category}>
                        {categoryLabels[article.category]}
                      </span>
                      {article.featured && (
                        <span className={styles.featuredBadge}>À la une</span>
                      )}
                    </div>

                    <p className={styles.date}>
                      {formatDate(article.publishedAt || article.createdAt)}
                    </p>

                    <h3>{article.title}</h3>
                    <p className={styles.excerpt}>{article.excerpt}</p>

                    <Link
                      href={`/news/${article.slug}`}
                      className={styles.readLink}
                    >
                      Lire l&apos;actualité <span>→</span>
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>

        <p className={styles.footerHint}>
          <span>✦</span>
          Choisissez une nouvelle pour en découvrir le contenu.
          <span>✦</span>
        </p>
      </div>
    </section>
  );
}
