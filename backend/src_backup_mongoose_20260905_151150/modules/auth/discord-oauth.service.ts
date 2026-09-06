import crypto from "crypto";
import { findByDiscordId } from "../discord/discord.repository";
import { UserRepository } from "../users/user.repository";
import { UserRole } from "../../common/constants/roles";
import {
  DiscordOAuthError,
  type DiscordOAuthUser,
} from "./discord-oauth.types";

const DISCORD_API_BASE = "https://discord.com/api/v10";

function getDiscordOAuthConfig() {
  const clientId = process.env.DISCORD_CLIENT_ID?.trim();
  const clientSecret = process.env.DISCORD_CLIENT_SECRET?.trim();
  const redirectUri = process.env.DISCORD_REDIRECT_URI?.trim();

  if (!clientId || !clientSecret || !redirectUri) {
    throw new DiscordOAuthError("failed");
  }

  return { clientId, clientSecret, redirectUri };
}

export class DiscordOAuthService {
  constructor(private readonly userRepository = new UserRepository()) {}

  createState() {
    return crypto.randomBytes(32).toString("hex");
  }

  isValidState(receivedState: string, expectedState: string) {
    const received = Buffer.from(receivedState, "utf8");
    const expected = Buffer.from(expectedState, "utf8");

    return (
      received.length === expected.length &&
      crypto.timingSafeEqual(received, expected)
    );
  }

  getAuthorizationUrl(state: string) {
    const { clientId, redirectUri } = getDiscordOAuthConfig();
    const url = new URL("https://discord.com/oauth2/authorize");

    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "identify");
    url.searchParams.set("state", state);

    return url.toString();
  }

  async getDiscordUserFromCode(code: string): Promise<DiscordOAuthUser> {
    const { clientId, clientSecret, redirectUri } = getDiscordOAuthConfig();

    const tokenResponse = await fetch(`${DISCORD_API_BASE}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      throw new DiscordOAuthError("failed");
    }

    const tokenPayload = (await tokenResponse.json()) as {
      access_token?: unknown;
    };

    if (
      typeof tokenPayload.access_token !== "string" ||
      !tokenPayload.access_token
    ) {
      throw new DiscordOAuthError("failed");
    }

    const userResponse = await fetch(`${DISCORD_API_BASE}/users/@me`, {
      headers: {
        Authorization: `Bearer ${tokenPayload.access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new DiscordOAuthError("failed");
    }

    const user = (await userResponse.json()) as Partial<DiscordOAuthUser>;

    if (typeof user.id !== "string" || typeof user.username !== "string") {
      throw new DiscordOAuthError("failed");
    }

    return {
      id: user.id,
      username: user.username,
    };
  }

  /**
   * Synchronise les droits issus de Discord avec le rôle du site.
   *
   * Règles :
   * - l'identifiant configuré dans PACTE_OWNER_DISCORD_ID est toujours OWNER ;
   * - un membre possédant DISCORD_ROLE_MEMBRE_DU_CERCLE obtient au minimum ADMIN ;
   * - un rôle supérieur n'est jamais rétrogradé ;
   * - la perte du rôle Discord ne retire pas un rôle déjà attribué manuellement.
   *
   * Cette fonction utilise le token du BOT côté serveur. Elle ne fait
   * jamais confiance aux données envoyées par le navigateur.
   */
  async syncSiteRole(user: any, discordId: string) {
    const ownerDiscordId = process.env.PACTE_OWNER_DISCORD_ID?.trim();
    const guildId = process.env.DISCORD_GUILD_ID?.trim();
    const circleRoleId = process.env.DISCORD_ROLE_MEMBRE_DU_CERCLE?.trim();
    const botToken = process.env.DISCORD_BOT_TOKEN?.trim();

    // Le propriétaire est déterminé avant toute interrogation Discord.
    if (ownerDiscordId && discordId === ownerDiscordId) {
      if (user.role !== UserRole.OWNER) {
        await this.userRepository.updateById(user._id.toString(), {
          role: UserRole.OWNER,
        });
        user.role = UserRole.OWNER;
      }

      return user;
    }

    // Sans configuration Discord complète, on ne bloque pas la connexion.
    if (!guildId || !circleRoleId || !botToken) {
      console.warn(
        "[Discord] Synchronisation des rôles ignorée : configuration Discord incomplète."
      );
      return user;
    }

    try {
      const memberResponse = await fetch(
        `${DISCORD_API_BASE}/guilds/${encodeURIComponent(
          guildId
        )}/members/${encodeURIComponent(discordId)}`,
        {
          headers: {
            Authorization: `Bot ${botToken}`,
          },
          cache: "no-store",
        }
      );

      if (memberResponse.status === 404) {
        // Le compte Discord n'est pas membre du serveur.
        return user;
      }

      if (!memberResponse.ok) {
        const body = await memberResponse.text().catch(() => "");
        console.warn(
          `[Discord] Impossible de vérifier les rôles de ${discordId} (${memberResponse.status}) ${body}`
        );
        return user;
      }

      const member = (await memberResponse.json()) as {
        roles?: unknown;
      };

      const roleIds = Array.isArray(member.roles)
        ? member.roles.filter((role): role is string => typeof role === "string")
        : [];

      const isCircleMember = roleIds.includes(circleRoleId);

          if (
      isCircleMember &&
      user.role !== UserRole.OWNER &&
      user.role !== UserRole.ADMIN
    ) {
      await this.userRepository.updateById(user._id.toString(), {
          role: UserRole.ADMIN,
        });

      user.role = UserRole.ADMIN;
    }

      return user;
    } catch (error) {
      // Une panne temporaire de Discord ne doit pas empêcher la connexion
      // d'un membre déjà lié à son compte du Pacte.
      console.warn(
        "[Discord] Erreur pendant la synchronisation des rôles :",
        error
      );

      return user;
    }
  }

  async getActiveUserFromDiscordId(discordId: string) {
    const link = await findByDiscordId(discordId);

    if (!link) {
      throw new DiscordOAuthError("not-linked");
    }

    const user = await this.userRepository.findById(link.memberId);

    if (!user) {
      console.warn("Discord OAuth link refers to a missing Pacte user.");
      throw new DiscordOAuthError("failed");
    }

    if (user.status === "SUSPENDED") {
      throw new DiscordOAuthError("suspended");
    }

    if (user.status !== "ACTIVE") {
      throw new DiscordOAuthError("failed");
    }

    return user;
  }
}
