import Image from "next/image";

export type AchievementLevel = 1 | 2 | 3;

interface AchievementBadgeProps {
  level: AchievementLevel | number;
  size?: number;
  className?: string;
  priority?: boolean;
}

const BADGES: Record<AchievementLevel, {
  src: string;
  alt: string;
  label: string;
}> = {
  1: {
    src: "/images/achievements/achievement-bronze.png",
    alt: "Badge d'exploit niveau 1 - Bronze",
    label: "Bronze",
  },
  2: {
    src: "/images/achievements/achievement-silver.png",
    alt: "Badge d'exploit niveau 2 - Argent",
    label: "Argent",
  },
  3: {
    src: "/images/achievements/achievement-gold.png",
    alt: "Badge d'exploit niveau 3 - Or",
    label: "Or",
  },
};

export default function AchievementBadge({
  level,
  size = 96,
  className = "",
  priority = false,
}: AchievementBadgeProps) {
  const normalizedLevel: AchievementLevel =
    level === 2 ? 2 : level === 3 ? 3 : 1;

  const badge = BADGES[normalizedLevel];

  return (
    <Image
      src={badge.src}
      alt={badge.alt}
      width={size}
      height={size}
      priority={priority}
      className={`object-contain ${className}`}
    />
  );
}

export function getAchievementBadge(level: number) {
  const normalizedLevel: AchievementLevel =
    level === 2 ? 2 : level === 3 ? 3 : 1;

  return BADGES[normalizedLevel];
}
