import {
  NextFunction,
  Request,
  Response,
} from "express";

import { AuthService } from "../modules/auth/auth.service";

const authService =
  new AuthService();

export interface AuthenticatedRequest
  extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
    role: string;
    mustChangePassword?: boolean;
  };
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const sessionToken =
      req.cookies?.pacte_session;

    /*
     * Aucun cookie de session.
     */
    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message:
          "Authentification requise.",
      });
    }

    /*
     * Vérification de la session.
     */
    const user =
      await authService.getUserFromSession(
        sessionToken
      );

    /*
     * Session inexistante, expirée ou
     * utilisateur invalide.
     */
    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Session invalide ou expirée.",
      });
    }

    /*
     * Utilisateur authentifié disponible
     * pour les controllers suivants.
     */
    req.user = user;

    return next();
  } catch (error) {
    /*
     * IMPORTANT :
     * on garde l'erreur dans le terminal backend,
     * mais on renvoie toujours du JSON au frontend.
     */
    console.error(
      "❌ Erreur dans requireAuth :",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Erreur interne lors de l'authentification.",
    });
  }
}