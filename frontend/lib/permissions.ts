export const SITE_PERMISSIONS = {
  QUESTS_MANAGE: "quests.manage",
  ACHIEVEMENTS_MANAGE: "achievements.manage",
  ECONOMY_ADJUST: "economy.adjust",
  NEWS_MANAGE: "news.manage",
  ECONOMY_EXCHANGE_RATES_MANAGE: "economy.exchangeRates.manage",
} as const;

export type SitePermission =
  (typeof SITE_PERMISSIONS)[keyof typeof SITE_PERMISSIONS];

export function hasPermission(
  user: { permissions?: string[] } | null | undefined,
  permission: SitePermission
) {
  return Boolean(user?.permissions?.includes(permission));
}
