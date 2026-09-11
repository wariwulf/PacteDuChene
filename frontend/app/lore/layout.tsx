import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lore de Pax Dei",
  description:
    "Plongez dans les chroniques du Pacte du Chêne et découvrez notre histoire, notre univers et le lore de notre aventure dans Pax Dei.",
  alternates: { canonical: "/lore" },
  openGraph: {
    title: "Lore de Pax Dei — Les Chroniques du Pacte du Chêne",
    description:
      "Plongez dans les chroniques du Pacte du Chêne et découvrez notre histoire, notre univers et le lore de notre aventure dans Pax Dei.",
    url: "/lore",
    type: "website",
  },
};

export default function LoreLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
