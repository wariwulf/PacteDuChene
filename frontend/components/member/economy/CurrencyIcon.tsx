import type { CSSProperties } from "react";

export type CurrencyId = "solidus" | "argent" | "bronze";

const CURRENCY_IMAGES: Record<CurrencyId, string> = {
  solidus: "/images/economy/currency-solidus.png",
  argent: "/images/economy/currency-argent.png",
  bronze: "/images/economy/currency-bronze.png",
};

const CURRENCY_NAMES: Record<CurrencyId, string> = {
  solidus: "Solidus",
  argent: "Argent",
  bronze: "Bronze",
};

interface CurrencyIconProps {
  currencyId: CurrencyId;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export default function CurrencyIcon({
  currencyId,
  size = 40,
  className = "",
  style,
}: CurrencyIconProps) {
  return (
    <img
      src={CURRENCY_IMAGES[currencyId]}
      alt={CURRENCY_NAMES[currencyId]}
      width={size}
      height={size}
      className={`object-contain ${className}`}
      style={style}
    />
  );
}

export function getCurrencyImage(currencyId: CurrencyId): string {
  return CURRENCY_IMAGES[currencyId];
}
