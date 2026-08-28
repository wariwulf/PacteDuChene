import type { ReactNode } from "react";

interface AchievementsPageBackgroundProps {
  children: ReactNode;
}

/**
 * Fond décoratif de la page Exploits.
 *
 * Le fond reste purement visuel : aucun élément métier, aucune donnée
 * d'exploit et aucune logique de sélection n'est modifiée ici.
 */
export default function AchievementsPageBackground({
  children,
}: AchievementsPageBackgroundProps) {
  return (
    <div className="relative min-h-full overflow-hidden bg-[#06130d] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[url('/images/backgrounds/achievements-background.png')] bg-cover bg-center bg-no-repeat"
      />

      {/* Voile sombre pour conserver une bonne lisibilité des cartes. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#06130d]/35 via-[#06130d]/65 to-[#06130d]/90"
      />

      {/* Léger voile supplémentaire sur les côtés afin de laisser le centre respirer. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(6,19,13,0.12)_48%,rgba(6,19,13,0.5)_100%)]"
      />

      <div className="relative z-10">{children}</div>
    </div>
  );
}
