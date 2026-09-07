import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lore — Le Pacte du Chêne",
  description: "Plongez dans les archives et les chroniques du Pacte du Chêne dans l'univers de Pax Dei.",
  alternates: {
    canonical: "/lore",
  },
  openGraph: {
    title: "Lore — Le Pacte du Chêne",
    description: "Plongez dans les archives et les chroniques du Pacte du Chêne dans l'univers de Pax Dei.",
    url: "/lore",
    type: "website",
  },
};

export default function LoreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
