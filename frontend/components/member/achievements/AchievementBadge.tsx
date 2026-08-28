import Image from "next/image";
import type { AchievementLevel } from "../../../types/achievements.types";

interface AchievementBadgeProps {
  level: AchievementLevel;
  compact?: boolean;
  size?: number;
}

const levelData: Record<AchievementLevel, {
  label: string;
  src: string;
  alt: string;
}> = {
  1: {
    label: "Bronze",
    src: "/images/achievements/achievement-bronze.png",
    alt: "Badge Bronze — niveau 1",
  },
  2: {
    label: "Argent",
    src: "/images/achievements/achievement-silver.png",
    alt: "Badge Argent — niveau 2",
  },
  3: {
    label: "Or",
    src: "/images/achievements/achievement-gold.png",
    alt: "Badge Or — niveau 3",
  },
};

export function AchievementBadge({ level, compact = false, size }: AchievementBadgeProps) {
  const data = levelData[level];
  const imageSize = size ?? (compact ? 32 : 56);

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/10 font-semibold ${
        compact ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm"
      }`}
    >
      <Image
        src={data.src}
        alt={data.alt}
        width={imageSize}
        height={imageSize}
        className="h-auto w-auto object-contain"
      />
      <span>{data.label}</span>
    </span>
  );
}

export function AchievementBadgeImage({
  level,
  size = 64,
  priority = false,
}: {
  level: AchievementLevel;
  size?: number;
  priority?: boolean;
}) {
  const data = levelData[level];

  return (
    <Image
      src={data.src}
      alt={data.alt}
      width={size}
      height={size}
      priority={priority}
      className="object-contain"
    />
  );
}
