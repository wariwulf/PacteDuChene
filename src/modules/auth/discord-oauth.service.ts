import crypto from "crypto";
import { findByDiscordId } from "../discord/discord.repository";
import { syncCircleRoleForUser } from "../discord/discord.service";
import { UserRepository } from "../users/user.repository";
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

    const tokenPayload = (await tokenResponse.json()) as { access_token?: unknown };
    if (typeof tokenPayload.access_token !== "string" || !tokenPayload.access_token) {
      throw new DiscordOAuthError("failed");
    }

    const userResponse = await fetch(`${DISCORD_API_BASE}/users/@me`, {
      headers: { Authorization: `Bearer ${tokenPayload.access_token}` },
    });

    if (!userResponse.ok) {
      throw new DiscordOAuthError("failed");
    }

    const user = (await userResponse.json()) as Partial<DiscordOAuthUser>;
    if (typeof user.id !== "string" || typeof user.username !== "string") {
      throw new DiscordOAuthError("failed");
    }

    return { id: user.id, username: user.username };
  }

  async getActiveUserFromDiscordId(discordId: string) {
    const link = await findByDiscordId(discordId);
    if (!link) throw new DiscordOAuthError("not-linked");

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

    try {
      await syncCircleRoleForUser(user._id.toString(), discordId);
    } catch (error) {
      console.error("Erreur synchronisation rôle Discord OAuth :", error);
      // L'authentification ne doit pas échouer uniquement parce que
      // la synchronisation des rôles Discord est temporairement indisponible.
    }

    const refreshedUser = await this.userRepository.findById(
      user._id.toString()
    );

    return refreshedUser ?? user;
  }
}
