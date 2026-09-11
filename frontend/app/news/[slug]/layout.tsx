import type { Metadata } from "next";

const siteUrl = "https://lepacteduchene.fr";
const apiUrl =
  process.env.PACTE_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

interface NewsArticle {
  title: string;
  slug: string;
  excerpt: string;
  image?: string;
  publishedAt?: string;
  createdAt: string;
}
interface NewsResponse {
  success: boolean;
  data?: { news?: NewsArticle };
}

async function getArticle(slug: string): Promise<NewsArticle | null> {
  try {
    const response = await fetch(
      `${apiUrl}/news/${encodeURIComponent(slug)}`,
      { cache: "no-store" },
    );
    if (!response.ok) return null;
    const payload = (await response.json()) as NewsResponse;
    return payload.success && payload.data?.news ? payload.data.news : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    return {
      title: "Actualité introuvable",
      description: "Cette actualité du Pacte du Chêne n'est plus disponible.",
      robots: { index: false, follow: true },
    };
  }

  const description =
    article.excerpt?.trim() ||
    "Découvrez cette actualité du Pacte du Chêne autour de Pax Dei.";

  const image = article.image
    ? article.image.startsWith("http")
      ? article.image
      : `${siteUrl}${article.image.startsWith("/") ? "" : "/"}${article.image}`
    : `${siteUrl}/opengraph-image.jpg`;

  return {
    title: article.title,
    description,
    alternates: { canonical: `/news/${article.slug}` },
    openGraph: {
      title: article.title,
      description,
      url: `${siteUrl}/news/${encodeURIComponent(article.slug)}`,
      siteName: "Le Pacte du Chêne",
      locale: "fr_FR",
      type: "article",
      publishedTime: article.publishedAt ?? article.createdAt,
      images: [{ url: image, alt: article.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description,
      images: [image],
    },
  };
}

export default function NewsArticleLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
