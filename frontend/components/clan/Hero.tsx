"use client";

import { useRouter } from "next/navigation";
import HeroBackground from "./HeroBackground";
import OakButton from "@/components/ui/OakButton";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/contexts/AuthContext";

export default function Hero() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <section className="relative min-h-[calc(100vh-64px)] overflow-hidden">
      <HeroBackground />
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/45 to-[#07100b]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,.52)_100%)]" />

      <div className="pacte-hero-content relative z-10 flex min-h-[calc(100vh-64px)] flex-col items-center justify-center px-6 pb-20 pt-16 text-center sm:px-8">
        <div className="pacte-hero-kicker">Héritiers du Serment</div>

        <h1 className="pacte-hero-title mt-7 font-[var(--font-cinzel)] text-5xl font-bold uppercase leading-[1.05] tracking-[0.16em] text-[#f5e8c8] sm:text-6xl md:text-7xl lg:text-8xl">
          Le Pacte
          <span className="block text-[#e2c98d]">du Chêne</span>
        </h1>

        <div className="my-7 flex items-center gap-3 text-[#c6a15b]">
          <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#c6a15b]/70 sm:w-20" />
          <span className="text-xl">✦</span>
          <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#c6a15b]/70 sm:w-20" />
        </div>

        <p className="pacte-hero-subtitle text-base leading-7 sm:text-lg sm:leading-8 md:text-xl">
          Sous les branches du vieux chêne, les serments traversent les âges.
          <br className="hidden sm:block" />
          Rejoignez une communauté où chaque membre contribue à écrire l&apos;histoire du clan.
        </p>

        <div className="mt-10">
          <OakButton onClick={() => router.push(user ? "/espace-membre" : "/connexion")}>
            {user ? "Entrer dans mon domaine" : "Entrer dans le domaine"}
          </OakButton>
        </div>

        <button
          type="button"
          aria-label="Découvrir le Pacte"
          onClick={() => document.getElementById("notre-histoire")?.scrollIntoView({ behavior: "smooth" })}
          className="pacte-scroll-cue mt-16 flex flex-col items-center gap-2 text-xs uppercase tracking-[0.22em] transition hover:text-[#e2c98d]"
        >
          <span>Découvrir le Pacte</span>
          <ChevronDownIcon className="h-7 w-7" />
        </button>
      </div>
    </section>
  );
}