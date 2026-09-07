import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Membre — Le Pacte du Chêne",
  description:
    "Découvrez le profil d'un membre du Pacte du Chêne et sa place au sein du clan.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function MemberProfileLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
