export default function Presentation() {
  return (
    <section id="notre-histoire" className="pacte-history relative px-6 py-24 sm:px-8 md:py-28">
      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <p className="pacte-eyebrow">Notre histoire</p>

        <div className="pacte-divider mx-auto mt-5 max-w-md">
          <span className="text-xs">✦</span>
        </div>

        <h2 className="mt-6 font-[var(--font-cinzel)] text-3xl font-semibold tracking-wide text-[#f5e8c8] sm:text-4xl md:text-5xl">
          Unis par le serment,
          <span className="block text-[#e2c98d]">liés par le chêne.</span>
        </h2>

        <p className="mx-auto mt-8 max-w-3xl text-base leading-8 text-[var(--text-secondary)] sm:text-lg">
          Le Pacte du Chêne rassemble des joueurs passionnés souhaitant bâtir une communauté durable dans Pax Dei.
        </p>

        <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-[var(--text-muted)] sm:text-lg">
          Notre objectif n&apos;est pas uniquement de progresser ensemble, mais également de créer une véritable aventure où chacun peut participer à l&apos;histoire du clan.
        </p>

        <div className="mx-auto mt-12 grid max-w-3xl gap-4 text-left sm:grid-cols-3">
          <div className="pacte-card p-5">
            <div className="mb-3 text-2xl">🌳</div>
            <h3 className="font-[var(--font-cinzel)] text-lg text-[#e2c98d]">Le Serment</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">Une communauté fondée sur la confiance et l&apos;entraide.</p>
          </div>
          <div className="pacte-card p-5">
            <div className="mb-3 text-2xl">⚔️</div>
            <h3 className="font-[var(--font-cinzel)] text-lg text-[#e2c98d]">Le Clan</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">Chacun trouve sa place et contribue à la vie du Pacte.</p>
          </div>
          <div className="pacte-card p-5">
            <div className="mb-3 text-2xl">📜</div>
            <h3 className="font-[var(--font-cinzel)] text-lg text-[#e2c98d]">L&apos;Histoire</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">Les exploits et les récits de nos membres construisent notre mémoire commune.</p>
          </div>
        </div>
      </div>
    </section>
  );
}