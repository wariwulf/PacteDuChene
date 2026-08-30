import Hero from "@/components/clan/Hero";
import Presentation from "@/components/clan/Presentation";
import AmbientMusic from "@/components/AmbientMusic";

export default function Home() {
  return (
    <>
      <Hero />

      <Presentation />

      {/* Appel au recrutement */}
      <section className="relative overflow-hidden bg-[#06150f] px-6 py-20 md:py-24">
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-48 w-48 rounded-full bg-green-500/10 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-48 w-48 rounded-full bg-amber-600/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-400">
            Le Pacte du Chêne
          </p>

          <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">
            Le Pacte du Chêne recrute !
          </h2>

          <div className="mx-auto mt-6 max-w-2xl space-y-4 text-base leading-7 text-green-200 md:text-lg">
            <p>
              Sous les branches du Chêne, une nouvelle aventure commence.
            </p>

            <p>
              Si tu cherches une communauté soudée, des compagnons sur qui
              compter et l'envie de bâtir quelque chose qui nous dépasse,
              alors ta place est peut-être parmi nous.
            </p>

            <p>
              Que tu sois guerrier, artisan, récolteur ou simplement en quête
              d'une nouvelle aventure,{" "}
              <strong className="font-semibold text-green-100">
                chacun peut apporter sa pierre au Pacte.
              </strong>
            </p>

            <p className="font-medium text-amber-100">
              <strong>
                Rejoins-nous, prête ton Serment et viens écrire ton histoire
                sous le Chêne.
              </strong>
            </p>
          </div>

          <a
            href="https://discord.gg/TxSgWkzgbt"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center justify-center rounded-xl border border-amber-400/70 bg-amber-600 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-amber-950/30 transition hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-[#06150f]"
          >
            Rejoins-nous !
          </a>
        </div>
      </section>

      <AmbientMusic />
    </>
  );
}