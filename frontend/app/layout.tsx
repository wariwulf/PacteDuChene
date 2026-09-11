import type { Metadata } from "next";
import { Inter, Cinzel } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import GlobalNavbar from "@/components/GlobalNavbar";
import Footer from "@/components/Footer";
import "./globals.css";
import "../styles/theme.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel" });

const siteTitle = "Le Pacte du Chêne";
const siteDescription =
  "Découvrez Le Pacte du Chêne, une communauté francophone dédiée à Pax Dei. Retrouvez nos actualités, notre lore et la vie de notre communauté.";

export const metadata: Metadata = {
  metadataBase: new URL("https://lepacteduchene.fr"),
  title: {
    default: "Le Pacte du Chêne — Communauté francophone Pax Dei",
    template: `%s | ${siteTitle}`,
  },
  description: siteDescription,
  applicationName: siteTitle,
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/images/member/arbre-pacte.png",
    shortcut: "/images/member/arbre-pacte.png",
    apple: "/images/member/arbre-pacte.png",
  },
  openGraph: {
    title: "Le Pacte du Chêne — Communauté francophone Pax Dei",
    description: siteDescription,
    url: "https://lepacteduchene.fr/",
    siteName: siteTitle,
    locale: "fr_FR",
    type: "website",
    images: [{
      url: "/opengraph-image.jpg",
      width: 1200,
      height: 630,
      alt: "Le Pacte du Chêne — Communauté Pax Dei",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Le Pacte du Chêne — Communauté francophone Pax Dei",
    description: siteDescription,
    images: ["/opengraph-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
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
