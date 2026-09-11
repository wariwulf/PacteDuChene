import type { Metadata } from "next";
import NewsAmbientMusic from "@/components/NewsAmbientMusic";

export const metadata: Metadata = {
  title: "Actualités Pax Dei",
  description:
    "Retrouvez les actualités du Pacte du Chêne, les nouvelles de notre communauté et nos publications autour de Pax Dei.",
  alternates: { canonical: "/news" },
  openGraph: {
    title: "Actualités Pax Dei — Le Pacte du Chêne",
    description:
      "Retrouvez les actualités du Pacte du Chêne, les nouvelles de notre communauté et nos publications autour de Pax Dei.",
    url: "/news",
    type: "website",
  },
};

export default function NewsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {children}
      <NewsAmbientMusic />
    </>
  );
}
