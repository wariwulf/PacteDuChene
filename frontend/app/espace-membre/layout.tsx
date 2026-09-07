import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Espace membre — Le Pacte du Chêne",
    template: "%s — Espace membre | Le Pacte du Chêne",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#173d2b]">{children}</div>;
}
