import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inventaire — Le Pacte du Chêne",
  description: "Consultez l'inventaire et les ressources du Pacte du Chêne.",
  alternates: {
    canonical: "/inventaire",
  },
  openGraph: {
    title: "Inventaire — Le Pacte du Chêne",
    description: "Consultez l'inventaire et les ressources du Pacte du Chêne.",
    url: "/inventaire",
    type: "website",
  },
};

export default function InventaireLayout({ children }: { children: React.ReactNode }) {
  return children;
}
