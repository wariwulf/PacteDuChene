import { Router } from "express";

import {
  getMyDiscordProfile,
  getMemberDiscord,
  getMemberDiscordProfile,
  getMemberDiscordStatus,
  linkMemberDiscord,
  unlinkMemberDiscord,
} from "./discord.controller";

import { requireAuth } from "../../middleware/auth.middleware";

const router = Router();

/**
 * ============================================================
 * ESPACE PERSONNEL
 * ============================================================
 */

router.get(
  "/me",
  requireAuth,
  getMyDiscordProfile
);

/**
 * ============================================================
 * CONSULTATION DES MEMBRES
 * ============================================================
 *
 * Un membre peut consulter ses propres informations.
 * Le staff peut consulter celles des autres membres.
 */

router.get(
  "/member/:memberId",
  requireAuth,
  getMemberDiscord
);

router.get(
  "/profile/:memberId",
  requireAuth,
  getMemberDiscordProfile
);

router.get(
  "/status/:memberId",
  requireAuth,
  getMemberDiscordStatus
);

/**
 * ============================================================
 * ADMINISTRATION
 * ============================================================
 */

router.post(
  "/link",
  requireAuth,
  linkMemberDiscord
);

router.delete(
  "/link/:memberId",
  requireAuth,
  unlinkMemberDiscord
);

export default router;