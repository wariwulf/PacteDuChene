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
} from "./levels.controller";

import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";

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
  requireRole("ADMIN", "OWNER"),
  addXp
);

router.post(
  "/user/:userId/xp/remove",
  requireAuth,
  requireRole("ADMIN", "OWNER"),
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