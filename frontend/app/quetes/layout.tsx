import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quetes — Le Pacte du Chêne",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
