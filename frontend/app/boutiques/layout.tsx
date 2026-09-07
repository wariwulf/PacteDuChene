import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Boutiques — Le Pacte du Chêne",
  description: "Découvrez les boutiques, commerces et équipements disponibles au sein du Pacte du Chêne.",
  alternates: {
    canonical: "/boutiques",
  },
  openGraph: {
    title: "Boutiques — Le Pacte du Chêne",
    description: "Découvrez les boutiques, commerces et équipements disponibles au sein du Pacte du Chêne.",
    url: "/boutiques",
    type: "website",
  },
};

export default function BoutiquesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
