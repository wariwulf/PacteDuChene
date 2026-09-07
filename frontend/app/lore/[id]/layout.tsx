import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chronique — Le Pacte du Chêne",
  description:
    "Découvrez une chronique des archives du Pacte du Chêne et plongez dans son univers.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function LoreEntryLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
