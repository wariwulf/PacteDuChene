import { Router } from "express";

import {
  listAdminMembers,
  getAdminMember,
  createAdminMember,
  updateAdminMember,
  resetAdminPassword,
  suspendAdminMember,
  reactivateAdminMember,
  archiveAdminMember,
  restoreAdminMember,
  uploadAvatar,
  uploadMyAvatar,
  deleteMyAvatar,
} from "./users.controller";

import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { avatarUpload } from "./users.upload";

const router = Router();

const adminAccess = [
  requireAuth,
  requireRole("ADMIN", "OWNER"),
];

// Administration des comptes membres.
router.get(
  "/admin",
  ...adminAccess,
  listAdminMembers
);

router.get(
  "/admin/:id",
  ...adminAccess,
  getAdminMember
);

router.post(
  "/admin",
  ...adminAccess,
  createAdminMember
);

router.patch(
  "/admin/:id",
  ...adminAccess,
  updateAdminMember
);

// Portrait d'un membre sélectionné dans l'administration.
router.post(
  "/avatar/:id",
  ...adminAccess,
  avatarUpload.single("avatar"),
  uploadAvatar
);

// Portrait personnel du membre connecté.
router.post(
  "/avatar/me",
  requireAuth,
  avatarUpload.single("avatar"),
  uploadMyAvatar
);

router.delete(
  "/avatar/me",
  requireAuth,
  deleteMyAvatar
);

router.post(
  "/admin/:id/reset-password",
  ...adminAccess,
  resetAdminPassword
);

router.post(
  "/admin/:id/suspend",
  ...adminAccess,
  suspendAdminMember
);

router.post(
  "/admin/:id/reactivate",
  ...adminAccess,
  reactivateAdminMember
);

router.delete(
  "/admin/:id",
  ...adminAccess,
  archiveAdminMember
);

router.post(
  "/admin/:id/restore",
  ...adminAccess,
  restoreAdminMember
);

export default router;