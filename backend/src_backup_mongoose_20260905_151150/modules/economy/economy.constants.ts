export const CURRENCY_IDS = [
  "solidus",
  "argent",
  "bronze",
] as const;

export type CurrencyId = (typeof CURRENCY_IDS)[number];

export const CURRENCY_LABELS: Record<CurrencyId, string> = {
  solidus: "Solidus",
  argent: "Argent",
  bronze: "Bronze",
};

export function isCurrencyId(value: unknown): value is CurrencyId {
  return (
    typeof value === "string" &&
    (CURRENCY_IDS as readonly string[]).includes(value)
  );
}
