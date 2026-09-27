import { Router } from "express";

import {
  getLevels,
  createLevel,
  updateLevel,
  deleteLevel,
  getUserLevel,
  addXp,
  removeXp,
  setXp,
  setLevel,
  resetAllUserLevels,
} from "./levels.controller";

import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole, requirePermission } from "../../middleware/role.middleware";
import { SITE_PERMISSIONS } from "../../common/security/permissions";

const router = Router();

// =========================
// PALIERS
// =========================

// Consultation des paliers
router.get(
  "/",
  requireAuth,
  getLevels
);

// Gestion des paliers
router.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "OWNER"),
  createLevel
);

router.patch(
  "/:level",
  requireAuth,
  requireRole("ADMIN", "OWNER"),
  updateLevel
);

router.delete(
  "/:level",
  requireAuth,
  requireRole("ADMIN", "OWNER"),
  deleteLevel
);

// =========================
// REMISE À ZÉRO GLOBALE
// =========================

router.post(
  "/admin/reset-all",
  requireAuth,
  requireRole("OWNER"),
  resetAllUserLevels
);

// =========================
// NIVEAU D'UN MEMBRE
// =========================

router.get(
  "/user/:userId",
  requireAuth,
  getUserLevel
);

// =========================
// ADMINISTRATION XP
// =========================

router.post(
  "/user/:userId/xp/add",
  requireAuth,
  requirePermission(SITE_PERMISSIONS.LEVELS_XP_MANAGE),
  addXp
);

router.post(
  "/user/:userId/xp/remove",
  requireAuth,
  requirePermission(SITE_PERMISSIONS.LEVELS_XP_MANAGE),
  removeXp
);

router.post(
  "/user/:userId/xp/set",
  requireAuth,
  requireRole("ADMIN", "OWNER"),
  setXp
);

router.post(
  "/user/:userId/level/set",
  requireAuth,
  requireRole("ADMIN", "OWNER"),
  setLevel
);

router.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "OWNER"),
  createLevel
);

router.patch(
  "/:level",
  requireAuth,
  requireRole("ADMIN", "OWNER"),
  updateLevel
);

router.delete(
  "/:level",
  requireAuth,
  requireRole("ADMIN", "OWNER"),
  deleteLevel
);

export default router;