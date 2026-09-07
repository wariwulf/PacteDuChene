import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Niveaux — Le Pacte du Chêne",
  description: "Découvrez les niveaux et les paliers de progression du Pacte du Chêne.",
  alternates: {
    canonical: "/niveaux",
  },
  openGraph: {
    title: "Niveaux — Le Pacte du Chêne",
    description: "Découvrez les niveaux et les paliers de progression du Pacte du Chêne.",
    url: "/niveaux",
    type: "website",
  },
};

export default function NiveauxLayout({ children }: { children: React.ReactNode }) {
  return children;
}
