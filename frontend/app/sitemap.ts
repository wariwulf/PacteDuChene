import type { MetadataRoute } from "next";

const siteUrl = "https://lepacteduchene.fr";
const apiUrl =
  process.env.PACTE_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

interface NewsArticle {
  slug: string;
  published: boolean;
  publishedAt?: string;
  createdAt: string;
}
interface LoreEntry {
  loreId: string;
  enabled: boolean;
}
interface NewsResponse {
  success: boolean;
  data?: { news?: NewsArticle[] };
}
interface LoreResponse {
  success: boolean;
  data?: { lore?: LoreEntry[] };
}

async function fetchPublicNews(): Promise<NewsArticle[]> {
  try {
    const response = await fetch(`${apiUrl}/news`, { cache: "no-store" });
    if (!response.ok) return [];
    const payload = (await response.json()) as NewsResponse;
    return payload.success && Array.isArray(payload.data?.news)
      ? payload.data.news.filter((article) => article.published)
      : [];
  } catch {
    return [];
  }
}

async function fetchPublicLore(): Promise<LoreEntry[]> {
  try {
    const response = await fetch(`${apiUrl}/lore`, { cache: "no-store" });
    if (!response.ok) return [];
    const payload = (await response.json()) as LoreResponse;
    return payload.success && Array.isArray(payload.data?.lore)
      ? payload.data.lore.filter((entry) => entry.enabled)
      : [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [news, lore] = await Promise.all([
    fetchPublicNews(),
    fetchPublicLore(),
  ]);

  const base: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/news`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/lore`, changeFrequency: "weekly", priority: 0.9 },
  ];

  return [
    ...base,
    ...news.map((article) => ({
      url: `${siteUrl}/news/${encodeURIComponent(article.slug)}`,
      lastModified: article.publishedAt ?? article.createdAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...lore.map((entry) => ({
      url: `${siteUrl}/lore/${encodeURIComponent(entry.loreId)}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
