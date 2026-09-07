import type { Metadata } from "next";
import { Inter, Cinzel } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import GlobalNavbar from "@/components/GlobalNavbar";
import Footer from "@/components/Footer";
import "./globals.css";
import "../styles/theme.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel" });

export const metadata: Metadata = {
  metadataBase: new URL("https://lepacteduchene.fr"),
  title: "Le Pacte du Chêne",
  description:
    "Communauté francophone de Pax Dei. Unis sous le Chêne, nous bâtissons, explorons et défendons le Pacte.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Le Pacte du Chêne",
    description:
      "Communauté francophone de Pax Dei. Unis sous le Chêne, nous bâtissons, explorons et défendons le Pacte.",
    url: "https://lepacteduchene.fr/",
    siteName: "Le Pacte du Chêne",
    locale: "fr_FR",
    type: "website",
    images: [
      {
        url: "/opengraph-image.jpg",
        width: 1200,
        height: 630,
        alt: "Le Pacte du Chêne — Communauté Pax Dei",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Le Pacte du Chêne",
    description:
      "Communauté francophone de Pax Dei. Unis sous le Chêne, nous bâtissons, explorons et défendons le Pacte.",
    images: ["/opengraph-image.jpg"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} ${cinzel.variable}`}>
        <AuthProvider>
          <GlobalNavbar />
          <main className="min-h-[calc(100vh-68px)]">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}