import { Router } from "express";

import {
  getAllMembers,
  getMember,
  getMembersRole,
  getCurrentMember,
} from "./members.controller";

import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";

const router = Router();

// Profil du membre connecté
router.get(
  "/me",
  requireAuth,
  getCurrentMember
);

// Consultation des membres
router.get(
  "/",
  requireAuth,
  getAllMembers
);

// Consultation d'un membre
router.get(
  "/:id",
  requireAuth,
  getMember
);

// Consultation par rôle
router.get(
  "/role/:role",
  requireAuth,
  requireRole("ADMIN", "OWNER"),
  getMembersRole
);

export default router;