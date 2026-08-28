import Link from "next/link";

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

async function getNews(slug: string): Promise<NewsArticle | null> {
  try {
    const response = await fetch(`${API_URL}/news/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });

    if (!response.ok) return null;

    const payload = await response.json();
    return payload?.data?.news ?? null;
  } catch {
    return null;
  }
}

function formatDate(value?: string) {
  if (!value) return "Date non renseignée";
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getNews(slug);

  if (!article) {
    return (
      <main className="min-h-screen bg-green-950 text-white">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <Link href="/news" className="text-green-300 hover:text-white">
            ← Retour aux actualités
          </Link>

          <div className="mt-8 rounded-xl border border-red-700 bg-red-950/40 p-8">
            <h1 className="text-3xl font-bold text-red-300">
              Actualité introuvable
            </h1>
            <p className="mt-3 text-red-200">
              Cette actualité n&apos;existe pas ou n&apos;est plus publiée.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-green-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <Link href="/news" className="text-green-300 hover:text-white">
          ← Retour aux actualités
        </Link>

        <article className="mt-8 overflow-hidden rounded-xl border border-green-800 bg-green-900/50">
          {article.image && (
            <img
              src={article.image}
              alt={article.title}
              className="max-h-[420px] w-full object-cover"
            />
          )}

          <div className="p-8 md:p-10">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-amber-600/20 px-3 py-1 text-xs font-bold uppercase text-amber-400">
                {categoryLabels[article.category]}
              </span>

              {article.featured && (
                <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-green-950">
                  À la une
                </span>
              )}
            </div>

            <p className="mt-5 text-sm text-green-500">
              {formatDate(article.publishedAt || article.createdAt)}
            </p>

            <h1 className="mt-2 text-4xl font-bold md:text-5xl">
              {article.title}
            </h1>

            <p className="mt-6 text-xl leading-relaxed text-green-200">
              {article.excerpt}
            </p>

            <div className="my-8 border-t border-green-800" />

            <div className="whitespace-pre-wrap text-base leading-8 text-green-100">
              {article.content}
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}
