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
      </section>

      <AmbientMusic />
    </>
  );
}