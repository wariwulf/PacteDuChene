import type { CurrencyId } from "./economy.constants";

export type { CurrencyId } from "./economy.constants";

export interface Currency {
  currencyId: CurrencyId;
  name: string;
  description?: string;
  enabled: boolean;
  icon?: string;
}
