import Link from "next/link";
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
    news: NewsArticle;
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

async function getNewsBySlug(
  slug: string
): Promise<NewsArticle | null> {
  try {
    const response = await fetch(
      `${API_URL}/api/news/${slug}`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return null;
    }

    const data: NewsResponse = await response.json();

    return data.data.news;
  } catch (error) {
    console.error(
      "Erreur récupération actualité :",
      error
    );

    return null;
  }
}

interface NewsPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function NewsArticlePage({
  params,
}: NewsPageProps) {
  const { slug } = await params;

  const article = await getNewsBySlug(slug);

  if (!article) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12">
        <PageHeader
          eyebrow="Le domaine"
          title="Actualité introuvable"
          description="Cette actualité n'existe pas ou n'est plus disponible."
        />

        <div className="mt-8">
          <Link
            href="/espace-membre/actualites"
            className="text-sm font-semibold text-amber-500 transition hover:text-amber-400"
          >
            ← Retour aux actualités
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <PageHeader
        eyebrow="Le domaine"
        title={article.title}
        description={article.excerpt}
      />

      <article className="mt-10">
        <div className="mb-6 flex items-center gap-4">
          <span className="rounded-full bg-amber-600/15 px-3 py-1 text-xs font-semibold text-amber-500">
            {formatCategory(article.category)}
          </span>

          <time className="text-xs text-gray-500">
            {formatDate(
              article.publishedAt ?? article.createdAt
            )}
          </time>
        </div>

        {article.image && (
          <div className="mb-8 overflow-hidden rounded-xl border border-white/10">
            <img
              src={article.image}
              alt={article.title}
              className="h-auto w-full object-cover"
            />
          </div>
        )}

        <div className="rounded-xl border border-white/10 bg-black/20 p-6 md:p-8">
          <div className="whitespace-pre-line text-sm leading-7 text-gray-300">
            {article.content}
          </div>
        </div>

        <div className="mt-8">
          <Link
            href="/espace-membre/actualites"
            className="text-sm font-semibold text-amber-500 transition hover:text-amber-400"
          >
            ← Retour aux actualités
          </Link>
        </div>
      </article>
    </div>
  );
}