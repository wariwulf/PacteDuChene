/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { FormEvent, useEffect, useState } from "react";

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

interface FormState {
  title: string;
  excerpt: string;
  content: string;
  category: NewsCategory;
  image: string;
  published: boolean;
  featured: boolean;
  publishedAt: string;
}

const emptyForm: FormState = {
  title: "",
  excerpt: "",
  content: "",
  category: "PACTE",
  image: "",
  published: true,
  featured: false,
  publishedAt: "",
};

const categoryLabels: Record<NewsCategory, string> = {
  COMMUNAUTE: "Communauté",
  EVENEMENT: "Événement",
  PACTE: "Pacte",
  ANNONCE: "Annonce",
};

function toLocalDateTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 16);
}

export default function AdministrationNewsPage() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

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
      setError(err instanceof Error ? err.message : "Impossible de charger les actualités.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNews();
  }, []);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function editArticle(article: NewsArticle) {
    setEditingId(article._id);
    setMessage("");
    setError("");

    setForm({
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      category: article.category,
      image: article.image || "",
      published: article.published,
      featured: article.featured,
      publishedAt: toLocalDateTime(article.publishedAt),
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const body = {
        title: form.title.trim(),
        excerpt: form.excerpt.trim(),
        content: form.content,
        category: form.category,
        image: form.image.trim() || undefined,
        published: form.published,
        featured: form.featured,
        publishedAt: form.publishedAt
          ? new Date(form.publishedAt).toISOString()
          : undefined,
      };

      const response = await fetch(
        editingId
          ? `${API_URL}/news/${encodeURIComponent(editingId)}`
          : `${API_URL}/news`,
        {
          method: editingId ? "PUT" : "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          payload?.message || `Erreur serveur (${response.status})`
        );
      }

      setMessage(editingId ? "Actualité modifiée avec succès." : "Actualité créée avec succès.");
      resetForm();
      await loadNews();
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Impossible d'enregistrer l'actualité.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-green-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <header className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.3em] text-amber-400">
              Administration
            </p>
            <h1 className="text-4xl font-bold">Gestion des actualités</h1>
            <p className="mt-3 text-green-300">
              Créez, publiez et modifiez les actualités du Pacte du Chêne.
            </p>
          </div>

          <button
            onClick={loadNews}
            className="rounded-lg bg-amber-600 px-5 py-3 font-semibold hover:bg-amber-500"
          >
            Actualiser
          </button>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-700 bg-red-950/40 p-5 text-red-300">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 rounded-xl border border-green-700 bg-green-900/50 p-5 text-green-300">
            {message}
          </div>
        )}

        <section className="rounded-xl border border-green-800 bg-green-900/50 p-6 md:p-8">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
              {editingId ? "Modification" : "Nouvelle actualité"}
            </p>
            <h2 className="mt-1 text-2xl font-bold">
              {editingId ? "Modifier l'actualité" : "Créer une actualité"}
            </h2>
          </div>

          <form onSubmit={submit} className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-green-300">
                  Titre
                </span>
                <input
                  required
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="Titre de l'actualité"
                  className="w-full rounded-lg border border-green-700 bg-green-950 px-4 py-3 text-white outline-none focus:border-amber-500"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-green-300">
                  Catégorie
                </span>
                <select
                  value={form.category}
                  onChange={(e) =>
                    updateField("category", e.target.value as NewsCategory)
                  }
                  className="w-full rounded-lg border border-green-700 bg-green-950 px-4 py-3 text-white outline-none focus:border-amber-500"
                >
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-green-300">
                Résumé
              </span>
              <input
                required
                value={form.excerpt}
                onChange={(e) => updateField("excerpt", e.target.value)}
                placeholder="Courte présentation de l'actualité"
                className="w-full rounded-lg border border-green-700 bg-green-950 px-4 py-3 text-white outline-none focus:border-amber-500"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-green-300">
                Image
              </span>
              <input
                value={form.image}
                onChange={(e) => updateField("image", e.target.value)}
                placeholder="URL de l'image (optionnel)"
                className="w-full rounded-lg border border-green-700 bg-green-950 px-4 py-3 text-white outline-none focus:border-amber-500"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-green-300">
                Contenu
              </span>
              <textarea
                required
                rows={12}
                value={form.content}
                onChange={(e) => updateField("content", e.target.value)}
                placeholder="Rédigez ici le contenu complet..."
                className="w-full resize-y rounded-lg border border-green-700 bg-green-950 px-4 py-3 text-white outline-none focus:border-amber-500"
              />
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-green-300">
                  Date de publication
                </span>
                <input
                  type="datetime-local"
                  value={form.publishedAt}
                  onChange={(e) => updateField("publishedAt", e.target.value)}
                  className="w-full rounded-lg border border-green-700 bg-green-950 px-4 py-3 text-white outline-none focus:border-amber-500"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-green-700 bg-green-950 p-4">
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={(e) => updateField("published", e.target.checked)}
                    className="h-5 w-5 accent-amber-500"
                  />
                  <span>
                    <span className="block font-semibold">Publié</span>
                    <span className="text-xs text-green-400">
                      Visible publiquement
                    </span>
                  </span>
                </label>

                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-green-700 bg-green-950 p-4">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => updateField("featured", e.target.checked)}
                    className="h-5 w-5 accent-amber-500"
                  />
                  <span>
                    <span className="block font-semibold">À la une</span>
                    <span className="text-xs text-green-400">
                      Mettre en avant
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-amber-600 px-5 py-3 font-semibold text-white hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Enregistrement..."
                  : editingId
                    ? "Enregistrer les modifications"
                    : "Créer l'actualité"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-green-700 px-5 py-3 font-semibold text-green-200 hover:bg-green-800"
                >
                  Annuler
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="mt-8 rounded-xl border border-green-800 bg-green-900/50 p-6 md:p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Base des actualités
              </p>
              <h2 className="mt-1 text-2xl font-bold">Actualités publiées</h2>
            </div>
            <span className="rounded-full bg-green-800 px-3 py-1 text-sm text-green-200">
              {news.length} entrée{news.length !== 1 ? "s" : ""}
            </span>
          </div>

          {loading ? (
            <p className="py-8 text-center text-green-300">
              Chargement...
            </p>
          ) : news.length === 0 ? (
            <div className="rounded-lg border border-green-800 bg-green-950/50 p-8 text-center text-green-300">
              Aucune actualité publiée.
            </div>
          ) : (
            <div className="space-y-4">
              {news.map((article) => (
                <div
                  key={article._id}
                  className="rounded-lg border border-green-800 bg-green-950/50 p-5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold uppercase text-amber-400">
                          {categoryLabels[article.category]}
                        </span>
                        {article.featured && (
                          <span className="rounded-full bg-amber-600/20 px-2 py-1 text-xs text-amber-300">
                            À la une
                          </span>
                        )}
                      </div>

                      <h3 className="mt-2 text-xl font-bold">{article.title}</h3>
                      <p className="mt-1 text-sm text-green-400">
                        /news/{article.slug}
                      </p>
                      <p className="mt-3 text-green-300">{article.excerpt}</p>
                    </div>

                    <button
                      onClick={() => editArticle(article)}
                      className="shrink-0 rounded-lg border border-amber-600 px-4 py-2 font-semibold text-amber-300 hover:bg-amber-600 hover:text-white"
                    >
                      Modifier
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
