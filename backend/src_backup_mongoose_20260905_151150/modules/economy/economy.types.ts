import type { CurrencyId } from "./economy.constants";

export type { CurrencyId } from "./economy.constants";

export interface EconomyBalances {
  solidus: number;
  argent: number;
  bronze: number;
}

export interface EconomyDocument {
  userId: string;
  balances: EconomyBalances;
}

export type EconomyCurrencyBalance = {
  currencyId: CurrencyId;
  amount: number;
};

export interface DailyRewardResult {
  granted: boolean;
  amount: number;
  currencyId: string;
  currencyImage: string;
  newBalance: number;
  message: string;
}
