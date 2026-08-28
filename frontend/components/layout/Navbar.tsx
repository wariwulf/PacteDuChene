import Link from "next/link";

export default function Navbar() {
  return (
    <header className=" fixed top-0 left-0 z-50 w-full bg-black/35 backdrop-blur-md border-b border-white/10 " >
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-8">
        <div className="font-[var(--font-cinzel)] text-2xl font-bold">
          🌳 Le Pacte du Chêne
        </div>

        <div className="flex items-center gap-8 text-sm uppercase tracking-wider">
            <Link href="/">
                Accueil
            </Link>
            <Link href="/lore">
                Lore
            </Link>
            <Link href="/clan">
                Le Clan
            </Link>
            <Link href="/contact">
                Contact
            </Link>
            <Link href="/connexion">
                Connexion
            </Link>
        </div>
      </nav>
    </header>
  );
}