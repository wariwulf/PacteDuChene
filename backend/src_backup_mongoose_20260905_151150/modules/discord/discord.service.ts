import {
  createLink,
  deleteLink,
  findByDiscordId,
  findByMemberId,
  updateLink,
} from "./discord.repository";
import {
  DiscordProfile,
  LinkDiscordInput,
} from "./discord.types";

const DISCORD_API_BASE = "https://discord.com/api/v10";

type DiscordApiUser = {
  id: string;
  username: string;
  global_name?: string | null;
  avatar?: string | null;
};

type DiscordGuildMember = {
  user?: DiscordApiUser;
  nick?: string | null;
  avatar?: string | null;
  joined_at?: string | null;
  roles?: string[];
};

type DiscordGuildRole = {
  id: string;
  name: string;
  color?: number;
};

function getDiscordConfig() {
  const token = process.env.DISCORD_BOT_TOKEN?.trim();
  const guildId = process.env.DISCORD_GUILD_ID?.trim();

  if (!token) {
    throw new Error(
      "DISCORD_BOT_TOKEN n'est pas configuré dans le .env du backend."
    );
  }

  if (!guildId) {
    throw new Error(
      "DISCORD_GUILD_ID n'est pas configuré dans le .env du backend."
    );
  }

  return { token, guildId };
}

function getAuthorizationHeader(token: string) {
  return token.startsWith("Bot ") ? token : `Bot ${token}`;
}

async function discordFetch<T>(path: string): Promise<T> {
  const { token } = getDiscordConfig();

  const response = await fetch(`${DISCORD_API_BASE}${path}`, {
    method: "GET",
    headers: {
      Authorization: getAuthorizationHeader(token),
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");

    if (response.status === 401) {
      throw new Error(
        "Le token du bot Discord est invalide ou refusé par Discord."
      );
    }

    if (response.status === 403) {
      throw new Error(
        "Le bot Discord n'a pas les permissions nécessaires pour consulter ce serveur."
      );
    }

    if (response.status === 404) {
      throw new Error("Le membre ou le serveur Discord est introuvable.");
    }

    throw new Error(
      `Discord a répondu avec le statut ${response.status}. ${body}`.trim()
    );
  }

  return response.json() as Promise<T>;
}

function buildUserAvatarUrl(
  userId: string,
  avatarHash?: string | null
): string | null {
  if (!avatarHash) return null;

  const extension = avatarHash.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${extension}?size=256`;
}

function buildGuildAvatarUrl(
  guildId: string,
  userId: string,
  avatarHash?: string | null
): string | null {
  if (!avatarHash) return null;

  const extension = avatarHash.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/guilds/${guildId}/users/${userId}/avatars/${avatarHash}.${extension}?size=256`;
}

export async function getDiscordLink(memberId: string) {
  if (!memberId?.trim()) {
    throw new Error("memberId est requis.");
  }

  return findByMemberId(memberId.trim());
}

export async function linkDiscord(input: LinkDiscordInput) {
  const memberId = input.memberId?.trim();
  const discordId = input.discordId?.trim();
  const discordUsername = input.discordUsername?.trim();

  if (!memberId) {
    throw new Error("memberId est requis.");
  }

  if (!discordId) {
    throw new Error("discordId est requis.");
  }

  const existingMemberLink = await findByMemberId(memberId);
  const existingDiscordLink = await findByDiscordId(discordId);

  if (
    existingDiscordLink &&
    existingDiscordLink.memberId !== memberId
  ) {
    throw new Error("Ce compte Discord est déjà lié à un autre membre.");
  }

  if (existingMemberLink) {
    return updateLink(memberId, {
      discordId,
      discordUsername,
    });
  }

  return createLink({
    memberId,
    discordId,
    discordUsername,
  });
}

export async function unlinkDiscord(memberId: string) {
  if (!memberId?.trim()) {
    throw new Error("memberId est requis.");
  }

  return deleteLink(memberId.trim());
}

export async function getDiscordStatus(memberId: string) {
  const link = await getDiscordLink(memberId);

  return {
    linked: Boolean(link),
    link,
  };
}

export async function getDiscordProfile(
  memberId: string
): Promise<DiscordProfile | null> {
  const link = await getDiscordLink(memberId);

  if (!link) {
    return null;
  }

  const { guildId } = getDiscordConfig();

  let guildMember: DiscordGuildMember;

  try {
    guildMember = await discordFetch<DiscordGuildMember>(
      `/guilds/${encodeURIComponent(guildId)}/members/${encodeURIComponent(
        link.discordId
      )}`
    );
  } catch (error) {
    // Le compte peut être correctement lié dans notre base mais ne plus
    // être présent sur le serveur Discord.
    if (
      error instanceof Error &&
      error.message.includes("introuvable")
    ) {
      return {
        linked: true,
        inGuild: false,
        discordId: link.discordId,
        username: link.discordUsername || undefined,
        displayName: link.discordUsername || undefined,
        roles: [],
        link: link.toObject
          ? (link.toObject() as unknown as DiscordProfile["link"])
          : (link as unknown as DiscordProfile["link"]),
      };
    }

    throw error;
  }

  const user = guildMember.user;

  if (!user) {
    throw new Error(
      "Discord a retourné un membre sans informations utilisateur."
    );
  }

  const roleIds = guildMember.roles || [];
  const guildRoles = await discordFetch<DiscordGuildRole[]>(
    `/guilds/${encodeURIComponent(guildId)}/roles`
  );

  const roles = roleIds
    .map((roleId) => guildRoles.find((role) => role.id === roleId))
    .filter((role): role is DiscordGuildRole => Boolean(role))
    .map((role) => ({
      id: role.id,
      name: role.name,
      color: role.color,
    }));

  return {
    linked: true,
    inGuild: true,
    discordId: user.id,
    username: user.username,
    globalName: user.global_name ?? null,
    displayName:
      guildMember.nick || user.global_name || user.username,
    nickname: guildMember.nick ?? null,
    avatarUrl: buildUserAvatarUrl(user.id, user.avatar),
    guildAvatarUrl: buildGuildAvatarUrl(
      guildId,
      user.id,
      guildMember.avatar
    ),
    joinedAt: guildMember.joined_at ?? null,
    roles,
    link: link.toObject
      ? (link.toObject() as unknown as DiscordProfile["link"])
      : (link as unknown as DiscordProfile["link"]),
  };
}
