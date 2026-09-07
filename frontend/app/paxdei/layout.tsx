import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pax Dei — Le Pacte du Chêne",
  description: "Découvrez la communauté du Pacte du Chêne et notre aventure sur Pax Dei.",
  alternates: {
    canonical: "/paxdei",
  },
  openGraph: {
    title: "Pax Dei — Le Pacte du Chêne",
    description: "Découvrez la communauté du Pacte du Chêne et notre aventure sur Pax Dei.",
    url: "/paxdei",
    type: "website",
  },
};

export default function PaxdeiLayout({ children }: { children: React.ReactNode }) {
  return children;
}
