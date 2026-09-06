import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { DiscordOAuthError } from "./discord-oauth.types";
import { DiscordOAuthService } from "./discord-oauth.service";

const authService = new AuthService();
const discordOAuthService = new DiscordOAuthService();
const OAUTH_STATE_COOKIE = "pacte_discord_oauth_state";
const OAUTH_STATE_DURATION_MS = 10 * 60 * 1000;

export class AuthController {
  private sessionCookieOptions(expiresAt: Date) {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      expires: expiresAt,
      path: "/",
    };
  }

  private oauthStateCookieOptions() {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: OAUTH_STATE_DURATION_MS,
      path: "/api/auth/discord",
    };
  }

  private oauthStateClearCookieOptions() {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/api/auth/discord",
    };
  }

  private frontendUrl(pathname: string, oauthError?: string) {
    const frontendUrl =
      process.env.FRONTEND_URL?.trim() || "http://localhost:3000";

    const url = new URL(pathname, frontendUrl);

    if (oauthError) {
      url.searchParams.set("oauthError", oauthError);
    }

    return url.toString();
  }

  async startDiscordOAuth(_req: Request, res: Response) {
    try {
      const state = discordOAuthService.createState();

      res.cookie(
        OAUTH_STATE_COOKIE,
        state,
        this.oauthStateCookieOptions()
      );

      return res.redirect(
        discordOAuthService.getAuthorizationUrl(state)
      );
    } catch {
      return res.redirect(this.frontendUrl("/connexion", "failed"));
    }
  }

  async discordOAuthCallback(req: Request, res: Response) {
    const expectedState = req.cookies?.[OAUTH_STATE_COOKIE];
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const receivedState =
      typeof req.query.state === "string" ? req.query.state : "";

    res.clearCookie(
      OAUTH_STATE_COOKIE,
      this.oauthStateClearCookieOptions()
    );

    if (
      typeof expectedState !== "string" ||
      !code ||
      !receivedState ||
      !discordOAuthService.isValidState(receivedState, expectedState)
    ) {
      return res.redirect(this.frontendUrl("/connexion", "failed"));
    }

    try {
      const discordUser =
        await discordOAuthService.getDiscordUserFromCode(code);

      const user =
        await discordOAuthService.getActiveUserFromDiscordId(
          discordUser.id
        );

      // Synchronisation des droits Discord AVANT la création de la session.
      // Ainsi la session créée contient immédiatement le nouveau rôle.
      await discordOAuthService.syncSiteRole(user, discordUser.id);

      const result = await authService.createSessionForUser(user);

      res.cookie(
        "pacte_session",
        result.sessionToken,
        this.sessionCookieOptions(result.expiresAt)
      );

      return res.redirect(this.frontendUrl("/espace-membre"));
    } catch (error) {
      const oauthError =
        error instanceof DiscordOAuthError ? error.code : "failed";

      return res.redirect(
        this.frontendUrl("/connexion", oauthError)
      );
    }
  }

  async register(req: Request, res: Response) {
    try {
      const user = await authService.register(req.body);

      return res.status(201).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Impossible de créer le compte.",
      });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const result = await authService.login(req.body);

      res.cookie(
        "pacte_session",
        result.sessionToken,
        this.sessionCookieOptions(result.expiresAt)
      );

      return res.json({
        success: true,
        data: { user: result.user },
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Connexion impossible.",
      });
    }
  }

  async me(req: Request, res: Response) {
    return res.json({
      success: true,
      data: { user: (req as any).user },
    });
  }

  async logout(req: Request, res: Response) {
    try {
      const sessionToken = req.cookies?.pacte_session;

      if (sessionToken) {
        await authService.logout(sessionToken);
      }

      res.clearCookie("pacte_session", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });

      return res.json({
        success: true,
        message: "Déconnexion réussie.",
      });
    } catch {
      return res.status(500).json({
        success: false,
        message: "Impossible de se déconnecter.",
      });
    }
  }
}
