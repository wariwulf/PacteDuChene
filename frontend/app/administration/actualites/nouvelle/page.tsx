"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api/client";

type NewsCategory =
  | "COMMUNAUTE"
  | "EVENEMENT"
  | "PACTE"
  | "ANNONCE";

interface CreateNewsResponse {
  success: boolean;
  data: {
    news: {
      _id: string;
      slug: string;
    };
  };
}

export default function NouvelleActualitePage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] =
    useState<NewsCategory>("COMMUNAUTE");
  const [image, setImage] = useState("");
  const [published, setPublished] = useState(false);
  const [featured, setFeatured] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await apiFetch<CreateNewsResponse>(
        "/news",
        {
          method: "POST",
          body: JSON.stringify({
            title,
            excerpt,
            content,
            category,
            image: image || undefined,
            published,
            featured,
          }),
        }
      );

      if (!response.success) {
        throw new Error(
          "Impossible de créer l'actualité."
        );
      }

      router.push("/administration/actualites");
      router.refresh();
    } catch (error) {
      console.error(
        "Erreur création actualité :",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue lors de la création."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8">
        <Link
          href="/administration/actualites"
          className="text-sm font-semibold text-amber-500 transition hover:text-amber-400"
        >
          ← Retour aux actualités
        </Link>
      </div>

      <div className="mb-10">
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.3em] text-amber-500">
          Administration
        </p>

        <h1 className="text-4xl font-bold text-white">
          Nouvelle actualité
        </h1>

        <p className="mt-3 text-gray-400">
          Créez une nouvelle actualité pour le Pacte du Chêne.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        <div className="rounded-xl border border-white/10 bg-black/20 p-6">
          <h2 className="mb-6 text-lg font-semibold text-white">
            Contenu
          </h2>

          <div className="space-y-5">
            <div>
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Titre
              </label>

              <input
                id="title"
                type="text"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                required
                maxLength={150}
                placeholder="Titre de l'actualité"
                className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-amber-500"
              />
            </div>

            <div>
              <label
                htmlFor="excerpt"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Résumé
              </label>

              <textarea
                id="excerpt"
                value={excerpt}
                onChange={(event) =>
                  setExcerpt(event.target.value)
                }
                required
                rows={3}
                placeholder="Court résumé de l'actualité..."
                className="w-full resize-y rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-amber-500"
              />
            </div>

            <div>
              <label
                htmlFor="content"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Contenu
              </label>

              <textarea
                id="content"
                value={content}
                onChange={(event) =>
                  setContent(event.target.value)
                }
                required
                rows={12}
                placeholder="Contenu complet de l'actualité..."
                className="w-full resize-y rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-6">
          <h2 className="mb-6 text-lg font-semibold text-white">
            Publication
          </h2>

          <div className="space-y-5">
            <div>
              <label
                htmlFor="category"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Catégorie
              </label>

              <select
                id="category"
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target.value as NewsCategory
                  )
                }
                className="w-full rounded-lg border border-white/10 bg-[#0b2b1f] px-4 py-3 text-white outline-none focus:border-amber-500"
              >
                <option value="COMMUNAUTE">
                  Communauté
                </option>

                <option value="EVENEMENT">
                  Événement
                </option>

                <option value="PACTE">
                  Pacte
                </option>

                <option value="ANNONCE">
                  Annonce
                </option>
              </select>
            </div>

            <div>
              <label
                htmlFor="image"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Image
              </label>

              <input
                id="image"
                type="url"
                value={image}
                onChange={(event) =>
                  setImage(event.target.value)
                }
                placeholder="https://..."
                className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-amber-500"
              />

              <p className="mt-2 text-xs text-gray-500">
                Pour le moment, utilisez l'URL d'une image.
                L'upload sera ajouté plus tard.
              </p>
            </div>

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={published}
                onChange={(event) =>
                  setPublished(event.target.checked)
                }
                className="h-4 w-4 accent-amber-500"
              />

              <span className="text-sm text-gray-300">
                Publier immédiatement
              </span>
            </label>

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={featured}
                onChange={(event) =>
                  setFeatured(event.target.checked)
                }
                className="h-4 w-4 accent-amber-500"
              />

              <span className="text-sm text-gray-300">
                Mettre à la une
              </span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4">
          <Link
            href="/administration/actualites"
            className="rounded-lg border border-white/10 px-5 py-3 text-sm font-semibold text-gray-300 transition hover:bg-white/5"
          >
            Annuler
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-amber-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Création..."
              : "Créer l'actualité"}
          </button>
        </div>
      </form>
    </div>
  );
}