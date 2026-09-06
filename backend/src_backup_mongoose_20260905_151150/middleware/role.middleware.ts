import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "./auth.middleware";
import { hasPermission, type SitePermission } from "../common/security/permissions";

export function requireRole(...allowedRoles: string[]) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentification requise.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Accès interdit.",
      });
    }

    return next();
  };
}

/**
 * Vérifie une permission fonctionnelle.
 *
 * Les permissions sont calculées par AuthService au moment de la
 * récupération de la session. Elles peuvent donc provenir du rôle
 * applicatif ou d'un rôle Discord de chef de faction.
 */
export function requirePermission(permission: SitePermission) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentification requise.",
      });
    }

    if (!hasPermission(req.user.permissions, permission)) {
      return res.status(403).json({
        success: false,
        message: "Vous ne disposez pas de la permission nécessaire.",
      });
    }

    return next();
  };
}
