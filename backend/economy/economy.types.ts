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
  currencyId: "bronze";
  currencyCode: "BRONZE";
  currencySymbol: "🥉";
  newBalance: number;
  message: string;
}

export interface VoiceRewardMemberInput {
  discordId: string;
  channelId: string;
  selfMute?: boolean;
  selfDeaf?: boolean;
  serverMute?: boolean;
  serverDeaf?: boolean;
  alone?: boolean;
  afk?: boolean;
}

export interface VoiceRewardTickResult {
  processed: number;
  rewarded: number;
  bronzeGranted: number;
  skipped: number;
}

