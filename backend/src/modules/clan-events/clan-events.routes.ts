import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import {
  listUpcoming,
  getEvent,
  setParticipation,
  removeParticipation,
  listAdmin,
  createAdmin,
  updateAdmin,
  deleteAdmin,
} from "./clan-events.controller";

const router = Router();

const adminAccess = [
  requireAuth,
  requireRole("ADMIN", "OWNER"),
];

// Administration — placé avant /:eventId pour éviter les collisions.
router.get("/admin/all", ...adminAccess, listAdmin);
router.post("/admin", ...adminAccess, createAdmin);
router.patch(
  "/admin/:eventId",
  ...adminAccess,
  updateAdmin
);
router.delete(
  "/admin/:eventId",
  ...adminAccess,
  deleteAdmin
);

// Espace membre
router.get("/upcoming", requireAuth, listUpcoming);
router.get("/:eventId", requireAuth, getEvent);

router.post(
  "/:eventId/participation",
  requireAuth,
  setParticipation
);

router.delete(
  "/:eventId/participation",
  requireAuth,
  removeParticipation
);

export default router;
