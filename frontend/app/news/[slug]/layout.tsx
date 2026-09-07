import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Actualité — Le Pacte du Chêne",
  description:
    "Retrouvez les actualités et annonces du Pacte du Chêne, communauté francophone de Pax Dei.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function NewsArticleLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
