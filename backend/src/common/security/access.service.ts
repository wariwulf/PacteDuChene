import { UserRole } from "../constants/roles";
import {
  FACTION_LEADER_PERMISSIONS,
  FACTION_LEADER_ROLE_IDS,
  permissionsForSiteRole,
  type SitePermission,
} from "./permissions";

const DISCORD_API_BASE = "https://discord.com/api/v10";
const CACHE_TTL_MS = 5 * 60 * 1000;

const discordRoleCache = new Map<
  string,
  { expiresAt: number; roleIds: string[] }
>();

async function getDiscordRoleIds(discordId: string): Promise<string[]> {
  const guildId = process.env.DISCORD_GUILD_ID?.trim();
  const botToken = process.env.DISCORD_BOT_TOKEN?.trim();

  if (!guildId || !botToken || !discordId) return [];

  const cached = discordRoleCache.get(discordId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.roleIds;
  }

  try {
    const response = await fetch(
      `${DISCORD_API_BASE}/guilds/${encodeURIComponent(guildId)}/members/${encodeURIComponent(discordId)}`,
      {
        headers: { Authorization: `Bot ${botToken}` },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      discordRoleCache.delete(discordId);
      return [];
    }

    const member = (await response.json()) as { roles?: unknown };
    const roleIds = Array.isArray(member.roles)
      ? member.roles.filter(
          (role): role is string => typeof role === "string"
        )
      : [];

    discordRoleCache.set(discordId, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      roleIds,
    });

    return roleIds;
  } catch (error) {
    console.warn(
      "[Access] Impossible de vérifier les rôles Discord :",
      error
    );
    return [];
  }
}

export interface EffectiveAccess {
  permissions: SitePermission[];
  isFactionLeader: boolean;
  factionRoleId?: string;
}

export async function getEffectiveAccess(user: {
  role: UserRole | string;
  discord?: { discordId?: string } | null;
}): Promise<EffectiveAccess> {
  const rolePermissions = permissionsForSiteRole(user.role);

  if (rolePermissions.length > 0) {
    return {
      permissions: rolePermissions,
      isFactionLeader: false,
    };
  }

  const discordId = user.discord?.discordId?.trim();
  if (!discordId) {
    return { permissions: [], isFactionLeader: false };
  }

  const roleIds = await getDiscordRoleIds(discordId);
  const factionRoleId = Object.values(FACTION_LEADER_ROLE_IDS).find((id) =>
    roleIds.includes(id)
  );

  if (!factionRoleId) {
    return { permissions: [], isFactionLeader: false };
  }

  return {
    permissions: [...FACTION_LEADER_PERMISSIONS],
    isFactionLeader: true,
    factionRoleId,
  };
}
