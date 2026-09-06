import { UserRole } from "../constants/roles";

export const SITE_PERMISSIONS = {
  QUESTS_MANAGE: "quests.manage",
  ACHIEVEMENTS_MANAGE: "achievements.manage",
  ECONOMY_ADJUST: "economy.adjust",
  NEWS_MANAGE: "news.manage",
  ECONOMY_EXCHANGE_RATES_MANAGE: "economy.exchangeRates.manage",
} as const;

export type SitePermission =
  (typeof SITE_PERMISSIONS)[keyof typeof SITE_PERMISSIONS];

export const ALL_SITE_PERMISSIONS: readonly SitePermission[] = [
  SITE_PERMISSIONS.QUESTS_MANAGE,
  SITE_PERMISSIONS.ACHIEVEMENTS_MANAGE,
  SITE_PERMISSIONS.ECONOMY_ADJUST,
  SITE_PERMISSIONS.NEWS_MANAGE,
  SITE_PERMISSIONS.ECONOMY_EXCHANGE_RATES_MANAGE,
];

/** Rôles Discord qui donnent automatiquement les droits de chef de faction. */
export const FACTION_LEADER_ROLE_IDS = {
  MAITRE_DES_RESERVES: "1523341164558946335",
  COMPAGNON_DU_REX: "1543358103347531886",
  MAITRE_DOEUVRE: "1543357652933804062",
} as const;

export const FACTION_LEADER_PERMISSIONS: readonly SitePermission[] = [
  SITE_PERMISSIONS.QUESTS_MANAGE,
  SITE_PERMISSIONS.ACHIEVEMENTS_MANAGE,
  SITE_PERMISSIONS.ECONOMY_ADJUST,
  SITE_PERMISSIONS.NEWS_MANAGE,
];

export function permissionsForSiteRole(
  role: UserRole | string
): SitePermission[] {
  if (role === UserRole.OWNER || role === UserRole.ADMIN) {
    return [...ALL_SITE_PERMISSIONS];
  }

  if (role === UserRole.MODERATOR) {
    return [...FACTION_LEADER_PERMISSIONS];
  }

  return [];
}

export function hasPermission(
  permissions: readonly string[] | undefined,
  permission: SitePermission
): boolean {
  return Boolean(permissions?.includes(permission));
}
