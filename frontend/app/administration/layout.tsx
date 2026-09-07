import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Administration — Le Pacte du Chêne",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdministrationLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
