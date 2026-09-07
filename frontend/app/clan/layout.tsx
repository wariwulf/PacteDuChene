import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Le Clan — Le Pacte du Chêne",
  description: "Découvrez le clan du Pacte du Chêne, ses membres, ses rangs et son organisation dans Pax Dei.",
  alternates: {
    canonical: "/clan",
  },
  openGraph: {
    title: "Le Clan — Le Pacte du Chêne",
    description: "Découvrez le clan du Pacte du Chêne, ses membres, ses rangs et son organisation dans Pax Dei.",
    url: "/clan",
    type: "website",
  },
};

export default function ClanLayout({ children }: { children: React.ReactNode }) {
  return children;
}
