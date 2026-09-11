import type { Metadata } from "next";

const siteUrl = "https://lepacteduchene.fr";
const apiUrl =
  process.env.PACTE_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

interface LoreEntry {
  loreId: string;
  title: string;
  category: string;
  summary?: string;
  imageUrl?: string;
  enabled: boolean;
}
interface LoreResponse {
  success: boolean;
  data?: { lore?: LoreEntry[] };
}

async function getPublicLoreEntry(loreId: string): Promise<LoreEntry | null> {
  try {
    // The current backend detail endpoint does not filter disabled entries.
    // Use the public list so disabled lore cannot receive SEO metadata.
    const response = await fetch(`${apiUrl}/lore`, { cache: "no-store" });
    if (!response.ok) return null;
    const payload = (await response.json()) as LoreResponse;
    const entries =
      payload.success && Array.isArray(payload.data?.lore)
        ? payload.data.lore
        : [];
    return (
      entries.find((entry) => entry.enabled && entry.loreId === loreId) ?? null
    );
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ loreId: string }>;
}): Promise<Metadata> {
  const { loreId } = await params;
  const entry = await getPublicLoreEntry(loreId);

  if (!entry) {
    return {
      title: "Chronique introuvable",
      description:
        "Cette chronique des archives du Pacte du Chêne n'est plus disponible.",
      robots: { index: false, follow: true },
    };
  }

  const description =
    entry.summary?.trim() ||
    "Découvrez cette chronique des archives du Pacte du Chêne dans l'univers de Pax Dei.";

  const image = entry.imageUrl
    ? entry.imageUrl.startsWith("http")
      ? entry.imageUrl
      : `${siteUrl}${entry.imageUrl.startsWith("/") ? "" : "/"}${entry.imageUrl}`
    : `${siteUrl}/opengraph-image.jpg`;

  return {
    title: entry.title,
    description,
    alternates: { canonical: `/lore/${entry.loreId}` },
    openGraph: {
      title: `${entry.title} — Le Pacte du Chêne`,
      description,
      url: `${siteUrl}/lore/${encodeURIComponent(entry.loreId)}`,
      siteName: "Le Pacte du Chêne",
      locale: "fr_FR",
      type: "article",
      images: [{ url: image, alt: entry.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${entry.title} — Le Pacte du Chêne`,
      description,
      images: [image],
    },
  };
}

export default function LoreEntryLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
