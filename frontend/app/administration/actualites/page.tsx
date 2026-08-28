import Link from "next/link";
import PageHeader from "@/components/member/PageHeader";

interface NewsArticle {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: "COMMUNAUTE" | "EVENEMENT" | "PACTE" | "ANNONCE";
  image?: string;
  published: boolean;
  featured: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

interface NewsResponse {
  success: boolean;
  data: {
    news: NewsArticle[];
  };
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function formatCategory(category: NewsArticle["category"]) {
  const categories = {
    COMMUNAUTE: "Communauté",
    EVENEMENT: "Événement",
    PACTE: "Pacte",
    ANNONCE: "Annonce",
  };

  return categories[category];
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

async function getNews(): Promise<NewsArticle[]> {
  try {
    const response = await fetch(`${API_URL}/news`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Impossible de récupérer les actualités.");
    }

    const data: NewsResponse = await response.json();

    return data.data.news;
  } catch (error) {
    console.error(
      "Erreur récupération actualités administration :",
      error
    );

    return [];
  }
}

export default async function AdministrationActualitesPage() {
  const news = await getNews();

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8 flex items-end justify-between gap-6">
        <PageHeader
          eyebrow="Administration"
          title="Actualités"
          description="Gérez les nouvelles, annonces et événements du Pacte du Chêne."
        />

        <Link
          href="/administration/actualites/nouvelle"
          className="shrink-0 rounded-lg bg-amber-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-500"
        >
          + Nouvelle actualité
        </Link>
      </div>

      {news.length === 0 ? (
        <section className="rounded-xl border border-white/10 bg-black/20 p-10 text-center">
          <h2 className="text-xl font-semibold text-white">
            Aucune actualité
          </h2>

          <p className="mt-3 text-sm text-gray-400">
            Aucune actualité publiée n'est disponible pour le moment.
          </p>

          <Link
            href="/administration/actualites/nouvelle"
            className="mt-6 inline-block text-sm font-semibold text-amber-500 transition hover:text-amber-400"
          >
            Créer la première actualité →
          </Link>
        </section>
      ) : (
        <section className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="border-b border-white/10 bg-black/20">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Actualité
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Catégorie
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Statut
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                    À la une
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Date
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {news.map((article) => (
                  <tr
                    key={article._id}
                    className="transition hover:bg-white/[0.03]"
                  >
                    <td className="px-6 py-5">
                      <div>
                        <p className="font-semibold text-white">
                          {article.title}
                        </p>

                        <p className="mt-1 max-w-md truncate text-sm text-gray-500">
                          {article.excerpt}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <span className="rounded-full bg-amber-600/15 px-3 py-1 text-xs font-semibold text-amber-500">
                        {formatCategory(article.category)}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      {article.published ? (
                        <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-400">
                          Publié
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-500/10 px-3 py-1 text-xs font-semibold text-gray-400">
                          Brouillon
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-5">
                      {article.featured ? (
                        <span className="text-sm font-semibold text-amber-500">
                          ★ Oui
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">
                          Non
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-5 text-sm text-gray-400">
                      {formatDate(
                        article.publishedAt ?? article.createdAt
                      )}
                    </td>

                    <td className="px-6 py-5 text-right">
                      <Link
                        href={`/administration/actualites/${article._id}`}
                        className="text-sm font-semibold text-amber-500 transition hover:text-amber-400"
                      >
                        Modifier →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}