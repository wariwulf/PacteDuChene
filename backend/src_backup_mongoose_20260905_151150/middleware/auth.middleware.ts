import {
  NextFunction,
  Request,
  Response,
} from "express";

import { AuthService } from "../modules/auth/auth.service";
import type { AuthenticatedUser } from "../modules/auth/auth.types";

const authService = new AuthService();

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const sessionToken = req.cookies?.pacte_session;

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: "Authentification requise.",
      });
    }

    const user = await authService.getUserFromSession(sessionToken);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Session invalide ou expirée.",
      });
    }

    req.user = user;

    return next();
  } catch (error) {
    console.error("❌ Erreur dans requireAuth :", error);

    return res.status(500).json({
      success: false,
      message: "Erreur interne lors de l'authentification.",
    });
  }
}
