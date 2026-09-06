import crypto from "crypto";
import type { NextFunction, Request, Response } from "express";

/** Authentification application-à-application réservée au bot Discord. */
export function requireBotAuth(req: Request, res: Response, next: NextFunction) {
  const configuredKey = process.env.PACTE_BOT_API_KEY;
  const authorization = req.get("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";

  if (!configuredKey || !token) {
    return res.status(401).json({ success: false, message: "Authentification du bot requise." });
  }

  const expected = Buffer.from(configuredKey, "utf8");
  const received = Buffer.from(token, "utf8");

  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
    return res.status(401).json({ success: false, message: "Authentification du bot invalide." });
  }

  next();
}
