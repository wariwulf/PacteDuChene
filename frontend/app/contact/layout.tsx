import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — Le Pacte du Chêne",
  description: "Contactez le Pacte du Chêne et venez échanger avec notre communauté francophone de Pax Dei.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact — Le Pacte du Chêne",
    description: "Contactez le Pacte du Chêne et venez échanger avec notre communauté francophone de Pax Dei.",
    url: "/contact",
    type: "website",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
