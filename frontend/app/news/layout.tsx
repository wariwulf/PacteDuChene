import type { Metadata } from "next";
import NewsAmbientMusic from "@/components/NewsAmbientMusic";

export const metadata: Metadata = {
  title: "Actualités — Le Pacte du Chêne",
  description:
    "Actualités, annonces et nouvelles de la communauté francophone du Pacte du Chêne sur Pax Dei.",
  alternates: {
    canonical: "/news",
  },
  openGraph: {
    title: "Actualités — Le Pacte du Chêne",
    description:
      "Actualités, annonces et nouvelles de la communauté francophone du Pacte du Chêne sur Pax Dei.",
    url: "/news",
    type: "website",
  },
};

export default function NewsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <NewsAmbientMusic />
      {children}
    </>
  );
}
