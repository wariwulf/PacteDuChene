import { Router } from "express";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../../middleware/auth.middleware";
import { UserRole } from "../../common/constants/roles";
import * as controller from "./paxdei.catalog-admin.controller";

const router = Router();

function requirePaxDeiAdmin(
  req: AuthenticatedRequest,
  res: any,
  next: any,
) {
  const role = String(req.user?.role ?? "").toUpperCase();
  if (role === UserRole.OWNER || role === UserRole.ADMIN) return next();

  return res.status(403).json({
    success: false,
    message: "Cette administration est réservée au propriétaire et aux administrateurs.",
  });
}

router.use(requireAuth, requirePaxDeiAdmin);
router.get("/:factionId", controller.list);
router.post("/:factionId", controller.add);
router.patch("/:factionId/:itemId", controller.setEnabled);
router.post("/:factionId/:itemId/exclude", controller.exclude);
router.delete("/:factionId/:itemId/exclusion", controller.reinstate);
router.delete("/:factionId/:itemId", controller.remove);

export default router;
