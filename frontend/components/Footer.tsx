import Link from "next/link";

const footerLinks = [
  { href: "/", label: "Accueil" },
  { href: "/news", label: "Actualités" },
  { href: "/lore", label: "Lore" },
  { href: "/discord", label: "Discord" },
];

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-white/[.08] bg-[#06100a]">
      <div className="mx-auto max-w-7xl px-5 py-12 lg:px-6">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#c6a15b]/25 bg-[#23412f]/60 text-xl">🌳</span>
              <div>
                <p className="font-bold uppercase tracking-[.08em] text-[#f5e8c8] [font-family:var(--font-cinzel)]">Le Pacte du Chêne</p>
                <p className="text-[9px] font-semibold uppercase tracking-[.22em] text-[#9eaa9f]">Pacte · Honneur · Fraternité</p>
              </div>
            </div>
            <p className="mt-5 max-w-md text-sm leading-6 text-[#9eaa9f]">
              Communauté francophone de Pax Dei. Unis sous le chêne, nous bâtissons, explorons et défendons le Pacte.
            </p>
          </div>

          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[.22em] text-[#c6a15b]">Navigation</p>
            <div className="mt-4 space-y-2">
              {footerLinks.map((link) => (
                <Link key={link.href} href={link.href} className="block text-sm text-[#d7cfb4] transition hover:text-[#e2c98d]">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[.22em] text-[#c6a15b]">Le Pacte</p>
            <div className="mt-4 space-y-2 text-sm text-[#9eaa9f]">
              <p>Communauté Pax Dei</p>
              <p>Serveur Discord officiel</p>
              <p>Le site est en phase 1 de déploiement.</p>
            </div>
          </div>
        </div>

        <div className="my-8 h-px bg-gradient-to-r from-transparent via-[#c6a15b]/25 to-transparent" />

        <div className="flex flex-col gap-2 text-xs text-[#737f76] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Le Pacte du Chêne. Tous droits réservés.</p>
          <p>Fait sous le regard du Chêne.</p>
        </div>
      </div>
    </footer>
  );
}