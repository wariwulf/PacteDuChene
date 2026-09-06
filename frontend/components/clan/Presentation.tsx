"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const DISCORD_INVITE = "https://discord.gg/TxSgWkzgbt";

const featureCards = [
  {
    title: "Événements",
    eyebrow: "Vivre l'aventure ensemble",
    icon: "⚔️",
    image: "/images/pacte/community-event.png",
    text: "Donjons, PvP, récolte de ressources et événements de guilde rythment la vie du Pacte. Nous organisons aussi des événements RP, des cérémonies, des concours et des jeux. Des activités structurées, portées par l'implication de nos membres et toujours dans la bonne humeur.",
  },
  {
    title: "Quêtes",
    eyebrow: "Écrire notre propre histoire",
    icon: "📜",
    image: "/images/pacte/quests-system.png",
    text: "Le Pacte possède son propre système de quêtes. Chaque mission propose des objectifs, une progression et des récompenses, afin de donner à chacun des raisons de partir à l'aventure et de contribuer à l'histoire commune.",
  },
  {
    title: "Rôle-play",
    eyebrow: "Une histoire à vivre",
    icon: "👑",
    image: "/images/pacte/roleplay.png",
    text: "Notre semi-RP donne une dimension supplémentaire à la vie du clan sans imposer le jeu de rôle. Chaque membre entre comme Initié du Pacte, puis peut progresser vers les rangs de Frère Juré ou Sœur Jurée, choisir une faction et viser des fonctions plus prestigieuses.",
  },
];

const factions = [
  {
    name: "Domaine du Chêne",
    symbol: "/images/pacte/faction-domaine.png",
    text: "La voie du Domaine, au cœur de la vie et de la construction du Pacte.",
  },
  {
    name: "Confrérie de l'Épée",
    symbol: "/images/pacte/faction-confrerie.png",
    text: "La voie des combattants, de l'aventure et de la défense du Pacte.",
  },
  {
    name: "Guilde des Artisans",
    symbol: "/images/pacte/faction-artisans.png",
    text: "La voie de la maîtrise, de la production et du savoir-faire.",
  },
];

const adventures = [
  {
    image: "/images/pacte/adventure-group.png",
    title: "Ensemble sur les chemins",
    text: "Des expéditions aux événements de guilde, les meilleurs souvenirs se construisent à plusieurs.",
  },
  {
    image: "/images/pacte/adventure-landscape.png",
    title: "Explorer les terres de Pax Dei",
    text: "Partir plus loin, découvrir de nouveaux horizons et revenir avec une histoire à raconter.",
  },
  {
    image: "/images/pacte/adventure-settlement.png",
    title: "Bâtir notre domaine",
    text: "Chaque construction ajoute une pierre au Domaine du Chêne et à l'histoire de la communauté.",
  },
  {
    image: "/images/pacte/adventure-valley.png",
    title: "Des terres à parcourir",
    text: "Pax Dei offre un monde immense où chaque voyage peut devenir une nouvelle aventure.",
  },
  {
    image: "/images/pacte/adventure-expedition.png",
    title: "Partir à l'aventure",
    text: "Donjons, exploration, ressources et combats nous emmènent régulièrement au-delà de nos terres.",
  },
  {
    image: "/images/pacte/adventure-cave.png",
    title: "Face à l'inconnu",
    text: "Parce qu'un monde vivant réserve toujours quelques dangers à ceux qui s'y aventurent.",
  },
];

export default function Presentation() {
  const [activeAdventure, setActiveAdventure] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveAdventure((current) => (current + 1) % adventures.length);
    }, 6500);

    return () => window.clearInterval(timer);
  }, []);

  const adventure = adventures[activeAdventure];

  return (
    <main id="notre-histoire" className="pacte-discovery overflow-hidden bg-[#050d09] font-[var(--font-cinzel)] text-[#eee7d6]">
      {/* =====================================================
          01 — LE PACTE
         ===================================================== */}
      <section className="relative px-5 py-24 sm:px-8 md:py-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(180,130,45,.09),transparent_42%)]" />

        <div className="relative mx-auto max-w-6xl">
          <header className="mx-auto max-w-4xl text-center">
            <p className="pacte-discovery-eyebrow">Découvrir le Pacte</p>
            <div className="mx-auto mt-5 w-full max-w-2xl px-8 sm:px-12">
              <Image
                src="/images/pacte/section-divider.png"
                alt=""
                width={1919}
                height={463}
                className="h-auto w-full object-contain"
              />
            </div>
            <h2 className="mt-7 font-[var(--font-cinzel)] text-4xl font-semibold leading-tight tracking-wide text-[#f5e8c8] sm:text-5xl md:text-6xl">
              Unis par le serment,
              <span className="block text-[#e2c98d]">liés par le Chêne.</span>
            </h2>
            <p className="mx-auto mt-8 max-w-3xl text-base leading-8 text-[#c9c2b2] sm:text-lg">
              Le Pacte du Chêne est une communauté française réunissant des joueurs passionnés autour de Pax Dei. Nous avons choisi de faire de notre aventure bien plus qu'une succession de parties : un domaine à bâtir, une communauté à faire vivre et une histoire à écrire ensemble.
            </p>
          </header>

          <div className="mx-auto mt-16 grid w-full max-w-[1500px] gap-5 lg:grid-cols-3">
            {featureCards.map((card) => (
              <article
                key={card.title}
                className="group flex flex-col overflow-hidden rounded-2xl border border-[#b08a42]/45 bg-[#0b1912] shadow-2xl shadow-black/30 transition duration-300 hover:-translate-y-1 hover:border-[#d7bd82]/65"
                style={{ minHeight: "560px" }}
              >
                {/* Illustration : hauteur imposée explicitement pour éviter qu'une règle globale sur img ne l'écrase. */}
                <div
                  className="relative shrink-0 overflow-hidden border-b border-[#b08a42]/30"
                  style={{ height: "270px" }}
                >
                  <img
                    src={card.image}
                    alt=""
                    className="absolute inset-0 transition duration-700 group-hover:scale-105"
                    style={{
                      display: "block",
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition:
                        card.title === "Rôle-play" ? "center 28%" : "center center",
                    }}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/30" />
                </div>

                {/* Partie texte séparée de l'image. */}
                <div className="flex flex-1 flex-col px-6 py-7 text-center sm:px-8 sm:py-8">
                  <div className="mb-3 text-3xl drop-shadow-[0_2px_8px_rgba(0,0,0,.75)]">
                    {card.icon}
                  </div>

                  <p className="font-[var(--font-cinzel)] text-[10px] font-semibold uppercase tracking-[0.22em] text-[#e2c98d]">
                    {card.eyebrow}
                  </p>

                  <h3 className="mt-2 font-[var(--font-cinzel)] text-2xl font-semibold text-[#fff0cf] sm:text-3xl">
                    {card.title}
                  </h3>

                  <div className="mx-auto mt-4 h-px w-20 bg-gradient-to-r from-transparent via-[#b08a42]/70 to-transparent" />

                  <p className="mx-auto mt-5 max-w-[34rem] font-[var(--font-cinzel)] text-sm font-medium leading-7 text-[#d9d1c0] sm:text-base sm:leading-8">
                    {card.text}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-16 border-y border-[#b08a42]/20 py-14 sm:py-16">
            <div className="mx-auto max-w-4xl text-center">
              <p className="pacte-discovery-eyebrow">Une hiérarchie à vivre</p>
              <h3 className="mt-3 font-[var(--font-cinzel)] text-3xl font-semibold text-[#f3e4bf] sm:text-4xl">
                Une place pour chacun.
              </h3>
              <p className="mx-auto mt-5 max-w-4xl font-[var(--font-cinzel)] text-sm leading-7 text-[#c7c0b1] sm:text-base sm:leading-8">
                Le Pacte repose sur une progression qui récompense l'implication. De l'Initié au Frère Juré ou à la Sœur Jurée, chacun peut choisir sa voie et progresser au sein de sa faction. Les membres les plus investis peuvent viser le Dux Foederis ou des fonctions particulières comme le Chancelier ou le Maire du Palais.
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {factions.map((faction) => (
                <article
                  key={faction.name}
                  className="group flex min-h-[320px] flex-col items-center rounded-2xl border border-[#b08a42]/30 bg-[#0b1912]/75 p-6 text-center shadow-xl shadow-black/20 transition duration-300 hover:-translate-y-1 hover:border-[#d7bd82]/55 hover:bg-[#0d1d15]/90 sm:p-7"
                >
                  <div className="flex h-28 w-28 items-center justify-center sm:h-32 sm:w-32">
                    <Image
                      src={faction.symbol}
                      alt={`Symbole de la ${faction.name}`}
                      width={300}
                      height={300}
                      className="h-full w-full object-contain drop-shadow-[0_4px_14px_rgba(0,0,0,.55)] transition duration-300 group-hover:scale-105"
                    />
                  </div>

                  <h4 className="mt-4 font-[var(--font-cinzel)] text-xl font-semibold tracking-wide text-[#e2c98d] sm:text-2xl">
                    {faction.name}
                  </h4>

                  <div className="mx-auto mt-3 h-px w-20 bg-gradient-to-r from-transparent via-[#b08a42]/70 to-transparent" />

                  <p className="mt-4 max-w-sm font-[var(--font-cinzel)] text-sm leading-7 text-[#c9c2b2]">
                    {faction.text}
                  </p>

                  <p className="mt-auto pt-5 font-[var(--font-cinzel)] text-[10px] uppercase tracking-[0.18em] text-[#8f8a7d]">
                    3 distinctions • objectifs propres
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          02 — PAX DEI
         ===================================================== */}
      <section
        id="pax-dei"
        className="relative overflow-hidden bg-[#07110c]"
      >
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20 md:py-24">
          <header className="mx-auto max-w-3xl text-center">
            <p className="pacte-discovery-eyebrow">Le monde que nous avons choisi</p>

            <div className="mx-auto mt-3 w-full max-w-2xl px-8 sm:px-12">
              <Image
                src="/images/pacte/section-divider.png"
                alt=""
                width={1919}
                height={463}
                className="h-auto w-full object-contain"
              />
            </div>

            <h2 className="mt-5 font-[var(--font-cinzel)] text-3xl leading-tight text-[#f5e8c8] sm:text-3xl md:text-5xl">
              PAX DEI
            </h2>

            <p className="mt-3 font-[var(--font-cinzel)] text-lg text-[#d7bd82] sm:text-xl">
              Un monde à bâtir. Une histoire à écrire.
            </p>

            <p className="mt-5 text-sm leading-7 text-[#c4beaf] sm:text-sm sm:leading-7">
              Pax Dei est un MMO sandbox médiéval où le monde prend vie entre les mains des joueurs. Explorez des terres sauvages, construisez votre demeure, maîtrisez votre savoir-faire et partez à l'aventure. Ici, vous ne vous contentez pas de suivre une histoire : vous contribuez à la créer.
            </p>

            <a
              href="https://playpaxdei.com/fr-fr"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#e2c98d] transition hover:text-[#fff0cf]"
            >
              Découvrir Pax Dei sur le site officiel
              <span aria-hidden="true">↗</span>
            </a>
          </header>
        </div>

        <div
          className="relative flex w-full shrink-0 overflow-hidden bg-[#030906]"
          style={{ height: "clamp(440px, 42vw, 580px)", minHeight: "440px" }}
        >
          <div
            className="relative h-full min-w-0 flex-1 shrink-0 overflow-hidden"
            style={{ clipPath: "polygon(0 0, 100% 0, 94% 100%, 0 100%)" }}
          >
            <img
              src="/images/pacte/paxdei-landscape.jpg"
              alt="Paysages de Pax Dei"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/15" />
            <div className="absolute inset-x-0 bottom-0 h-[65%] bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
            <div className="absolute bottom-0 left-0 z-10 max-w-sm p-5 pb-7 sm:p-7 sm:pb-9">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#d7bd82]">Découvrir le monde</p>
              <h3 className="mt-2 font-[var(--font-cinzel)] text-2xl text-[#fff0cf] sm:text-3xl">Explorer</h3>
              <p className="mt-2 text-xs leading-5 text-[#f0e9da] sm:text-sm">Des terres sauvages, des vallées, des ruines et des horizons à découvrir.</p>
            </div>
          </div>

          <div
            className="relative -ml-[9%] h-full min-w-0 flex-1 shrink-0 overflow-hidden"
            style={{ clipPath: "polygon(7% 0, 100% 0, 93% 100%, 0 100%)" }}
          >
            <img
              src="/images/pacte/paxdei-settlement.jpg"
              alt="Construction dans Pax Dei"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/15" />
            <div className="absolute inset-x-0 bottom-0 h-[65%] bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
            <div className="absolute bottom-0 left-[14%] z-10 max-w-sm p-5 pb-7 sm:p-7 sm:pb-9">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#d7bd82]">Façonner son domaine</p>
              <h3 className="mt-2 font-[var(--font-cinzel)] text-2xl text-[#fff0cf] sm:text-3xl">Construire</h3>
              <p className="mt-2 text-xs leading-5 text-[#f0e9da] sm:text-sm">Maisons, ateliers et domaines prennent forme grâce aux joueurs.</p>
            </div>
          </div>

          <div
            className="relative -ml-[9%] h-full min-w-0 flex-1 shrink-0 overflow-hidden"
            style={{ clipPath: "polygon(7% 0, 100% 0, 100% 100%, 0 100%)" }}
          >
            <img
              src="/images/pacte/paxdei-combat.jpg"
              alt="Combat dans Pax Dei"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/15" />
            <div className="absolute inset-x-0 bottom-0 h-[65%] bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
            <div className="absolute bottom-0 left-[14%] z-10 max-w-sm p-5 pb-7 sm:p-7 sm:pb-9">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#d7bd82]">Partir à l'aventure</p>
              <h3 className="mt-2 font-[var(--font-cinzel)] text-2xl text-[#fff0cf] sm:text-3xl">Combattre</h3>
              <p className="mt-2 text-xs leading-5 text-[#f0e9da] sm:text-sm">Affrontez les dangers du monde et partez à l'aventure avec vos compagnons.</p>
            </div>
          </div>
        </div>

        <div className="h-10 sm:h-14" />
      </section>

      {/* =====================================================
          03 — NOS AVENTURES
         ===================================================== */}
      <section
        className="relative w-full overflow-hidden bg-[#07110c]"
        style={{ display: "block", width: "100%" }}
      >
        <div
          className="relative z-10 w-full px-5 pt-16 pb-8 sm:px-8 sm:pt-20 sm:pb-10 md:pt-24 md:pb-12"
          style={{ display: "block" }}
        >
          <header className="mx-auto max-w-6xl text-center">
            <p className="pacte-discovery-eyebrow">La vie du clan</p>
            <div className="mx-auto mt-3 w-full max-w-2xl px-8 sm:px-12">
              <Image
                src="/images/pacte/section-divider.png"
                alt=""
                width={1919}
                height={463}
                className="h-auto w-full object-contain"
              />
            </div>
            <h2 className="mt-1 font-[var(--font-cinzel)] text-4xl leading-tight text-[#f5e8c8] sm:text-5xl md:text-6xl">
              Nos aventures
            </h2>
          </header>

        {/* Petite respiration visuelle entre le titre et le carrousel. */}
        <div className="h-6 sm:h-8 md:h-10" aria-hidden="true" />

        </div>

        {/* Carrousel pleine largeur.
            La hauteur est fixée en inline pour éviter tout effondrement
            du conteneur avec les images en position absolute. */}
        <div
          className="relative w-full overflow-hidden bg-[#030906]"
          style={{
            position: "relative",
            display: "block",
            width: "100%",
            height: "clamp(420px, 48vw, 680px)",
            minHeight: "420px",
          }}
        >
          <Image
            src={adventure.image}
            alt={adventure.title}
            fill
            sizes="100vw"
            priority={activeAdventure === 0}
            className="object-cover transition-opacity duration-700"
          />

          {/* Voile général très discret. */}
          <div className="pointer-events-none absolute inset-0 bg-black/10" />

          {/* 
              Zone de lecture du texte.
              On ne dépend plus uniquement d'un simple drop-shadow :
              un véritable voile sombre accompagne le texte sur toute sa largeur.
              Cela garantit la lisibilité même lorsque l'image est très claire.
          */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-52 bg-gradient-to-b from-[#020805]/90 via-[#020805]/72 to-transparent sm:h-56 md:h-60" />

          {/* Texte de l'aventure — centré dans la partie haute de l'image. */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center px-6 pt-6 text-center sm:px-10 sm:pt-8 md:px-16 md:pt-10">
            <div className="w-full max-w-5xl">
              <h3
                className="font-[var(--font-cinzel)] text-2xl font-semibold leading-tight tracking-wide text-[#fff0cf] sm:text-3xl md:text-4xl"
                style={{
                  textShadow:
                    "0 2px 4px rgba(0,0,0,.95), 0 4px 14px rgba(0,0,0,.9)",
                }}
              >
                {adventure.title}
              </h3>

              <div className="mx-auto mt-3 h-px w-24 bg-[#d1a951]/70 shadow-[0_0_8px_rgba(0,0,0,.9)]" />

              <p
                className="mx-auto mt-3 max-w-4xl font-[var(--font-cinzel)] text-xs leading-5 text-[#f5ead5] sm:text-sm sm:leading-6 md:text-base"
                style={{
                  textShadow:
                    "0 2px 4px rgba(0,0,0,.98), 0 3px 10px rgba(0,0,0,.95)",
                }}
              >
                {adventure.text}
              </p>
            </div>
          </div>

          {/* Flèche gauche — discrète, contenue dans une zone de navigation dédiée. */}
          <div className="absolute left-3 z-20 flex h-24 w-14 -translate-y-1/2 items-center justify-center sm:left-5 sm:h-28 sm:w-16 md:left-7 md:h-32 md:w-18" style={{ top: "50%" }}>
            <button
              type="button"
              onClick={() =>
                setActiveAdventure(
                  (activeAdventure - 1 + adventures.length) % adventures.length
                )
              }
              aria-label="Aventure précédente"
              className="group flex h-full w-full items-center justify-center"
            >
              <Image
                src="/images/pacte/carousel-arrow-left.png"
                alt=""
                width={569}
                height={1034}
                className="h-16 w-auto max-w-full object-contain opacity-80 transition duration-300 group-hover:scale-105 group-hover:opacity-100 sm:h-20 md:h-24"
              />
            </button>
          </div>

          {/* Flèche droite — discrète, contenue dans une zone de navigation dédiée. */}
          <div className="absolute right-3 z-20 flex h-24 w-14 -translate-y-1/2 items-center justify-center sm:right-5 sm:h-28 sm:w-16 md:right-7 md:h-32 md:w-18" style={{ top: "50%" }}>
            <button
              type="button"
              onClick={() =>
                setActiveAdventure((activeAdventure + 1) % adventures.length)
              }
              aria-label="Aventure suivante"
              className="group flex h-full w-full items-center justify-center"
            >
              <Image
                src="/images/pacte/carousel-arrow-right.png"
                alt=""
                width={586}
                height={1094}
                className="h-16 w-auto max-w-full object-contain opacity-80 transition duration-300 group-hover:scale-105 group-hover:opacity-100 sm:h-20 md:h-24"
              />
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================
          04 — REJOINS-NOUS
         ===================================================== */}
      <section
        id="rejoins-nous"
        className="relative overflow-hidden bg-[#07110c] px-5 py-20 sm:px-8 sm:py-24 md:py-28"
      >
        {/* Lumières très discrètes : la section reste volontairement sobre. */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(180,130,45,.10),transparent_48%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[#b08a42]/35" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[#b08a42]/25" />

        <div className="relative mx-auto max-w-5xl text-center">
          <p className="pacte-discovery-eyebrow">Sous les branches du Chêne</p>

          <div className="mx-auto mt-4 w-full max-w-xl px-10 sm:px-16">
            <Image
              src="/images/pacte/section-divider.png"
              alt=""
              width={1919}
              height={463}
              className="h-auto w-full object-contain"
            />
          </div>

          <h2 className="mt-5 font-[var(--font-cinzel)] text-4xl leading-tight tracking-wide text-[#f5e8c8] sm:text-5xl md:text-6xl">
            Rejoins-nous
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-sm leading-7 text-[#c9c2b2] sm:text-base sm:leading-8">
            Que tu sois guerrier, artisan, bâtisseur, explorateur ou simplement à
            la recherche de compagnons avec lesquels partager Pax Dei, ta place
            peut être parmi nous.
          </p>

          <div className="mx-auto mt-9 grid max-w-4xl gap-4 sm:grid-cols-2">
            <a
              href={DISCORD_INVITE}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex min-h-[64px] items-center justify-center border border-[#c9a65a]/70 bg-[#0b1912] px-6 py-4 font-[var(--font-cinzel)] text-sm font-semibold uppercase tracking-[0.12em] text-[#f5e8c8] transition hover:border-[#e2c98d] hover:bg-[#102219] hover:text-[#fff4d8]"
            >
              Rejoindre le Discord
              <span className="ml-3 text-[#d1a951] transition-transform group-hover:translate-x-1">
                →
              </span>
            </a>

            <div className="flex min-h-[64px] flex-col justify-center border border-[#b08a42]/30 bg-[#0b1912]/75 px-6 py-4 text-center">
              <p className="font-[var(--font-cinzel)] text-sm font-semibold uppercase tracking-[0.16em] text-[#d1a951]">
                Nous trouver
              </p>
              <p className="mt-1 font-[var(--font-cinzel)] text-base text-[#f1e3c2]">
                Fenrir — Inni Gallia
              </p>
              <p className="mt-0.5 text-xs text-[#aaa596]">
                Javerdus, à proximité de Petra Mea
              </p>
            </div>
          </div>

          <div className="mx-auto mt-10 flex items-center justify-center gap-3">
            <span className="h-px w-20 bg-gradient-to-r from-transparent to-[#b08a42]/60" />
            <span className="text-sm text-[#d1a951]">✦</span>
            <span className="h-px w-20 bg-gradient-to-l from-transparent to-[#b08a42]/60" />
          </div>

          <p className="mt-4 font-[var(--font-cinzel)] text-base italic text-[#d7bd82] sm:text-lg">
            Prête ton Serment.
          </p>
        </div>
      </section>
    </main>
  );
}
