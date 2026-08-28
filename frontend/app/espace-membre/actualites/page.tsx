import PageHeader from "@/components/member/PageHeader";

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
  data: {
    news: NewsArticle[];
  };
}

const API_URL = "http://localhost:5000";

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
    const response = await fetch(`${API_URL}/api/news`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Impossible de récupérer les actualités.");
    }

    const data: NewsResponse = await response.json();

    return data.data.news;
  } catch (error) {
    console.error("Erreur récupération actualités :", error);

    return [];
  }
}

export default async function ActualitesPage() {
  const news = await getNews();

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <PageHeader
        eyebrow="Le domaine"
        title="Actualités"
        description="Retrouvez ici les nouvelles, annonces et événements du Pacte du Chêne."
      />

      {news.length === 0 ? (
        <section className="rounded-xl border border-white/10 bg-black/20 p-10 text-center">
          <h2 className="text-xl font-semibold text-white">
            Aucune actualité pour le moment
          </h2>

          <p className="mt-3 text-sm text-gray-400">
            Les nouvelles du Pacte apparaîtront ici prochainement.
          </p>
        </section>
      ) : (
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {news.map((article) => (
            <article
              key={article._id}
              className="flex flex-col rounded-xl border border-white/10 bg-black/20 p-6 transition hover:border-amber-600/40 hover:bg-black/30"
            >
              <div className="mb-4 flex items-center justify-between gap-4">
                <span className="rounded-full bg-amber-600/15 px-3 py-1 text-xs font-semibold text-amber-500">
                  {formatCategory(article.category)}
                </span>

                <time className="text-xs text-gray-500">
                  {formatDate(
                    article.publishedAt ?? article.createdAt
                  )}
                </time>
              </div>

              <h2 className="mb-3 text-xl font-semibold text-white">
                {article.title}
              </h2>

              <p className="text-sm leading-6 text-gray-400">
                {article.excerpt}
              </p>

              <a
                href={`/espace-membre/actualites/${article.slug}`}
                className="mt-6 self-start text-sm font-semibold text-amber-500 transition hover:text-amber-400"
              >
                Lire la suite →
              </a>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}