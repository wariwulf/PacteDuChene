import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "./auth.middleware";

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

    next();
  };
}