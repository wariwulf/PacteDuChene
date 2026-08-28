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
  title: "Le Pacte du Chêne",
  description: "Communauté Pax Dei",
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