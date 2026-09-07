import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Discord — Le Pacte du Chêne",
  description: "Rejoignez la communauté Discord du Pacte du Chêne et échangez avec ses membres.",
  alternates: {
    canonical: "/discord",
  },
  openGraph: {
    title: "Discord — Le Pacte du Chêne",
    description: "Rejoignez la communauté Discord du Pacte du Chêne et échangez avec ses membres.",
    url: "/discord",
    type: "website",
  },
};

export default function DiscordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
