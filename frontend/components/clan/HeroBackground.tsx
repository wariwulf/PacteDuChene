import Image from "next/image";

export default function HeroBackground() {
  return (
    <>
      <Image
        src="/images/hero.png"
        alt="Le Chêne du Pacte"
        fill
        priority
        className="object-cover object-center"
      />

      {/* Overlay sombre */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Dégradé vers la section suivante */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-[var(--color-forest)]" />
    </>
  );
}