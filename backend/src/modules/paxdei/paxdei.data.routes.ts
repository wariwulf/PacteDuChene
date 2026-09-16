import { Router } from "express";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../../middleware/auth.middleware";
import { UserRole } from "../../common/constants/roles";
import * as controller from "./paxdei.data.controller";
import paxDeiCatalogAdminRoutes from "./paxdei.catalog-admin.routes";

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
    message: "Seul un administrateur peut administrer la base Pax Dei.",
  });
}

router.get("/status", requireAuth, controller.status);
router.post("/sync", requireAuth, requirePaxDeiAdmin, controller.sync);
router.use("/catalog", paxDeiCatalogAdminRoutes);

export default router;
