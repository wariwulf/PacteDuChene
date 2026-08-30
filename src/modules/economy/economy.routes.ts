import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import {
  getBalances,
  addBalance,
  removeBalance,
  getHistory,
} from "./economy.controller";

import currenciesRoutes from "./currencies.routes";

const router = Router();

/*
 * ============================
 * MONNAIES
 * ============================
 */

router.use("/currencies", currenciesRoutes);

/*
 * ============================
 * ECONOMIE UTILISATEUR
 * ============================
 */

router.get("/:userId", getBalances);

router.get("/:userId/history", getHistory);

router.post("/:userId/add", requireAuth, requireRole("MODERATOR", "ADMIN", "OWNER"), addBalance);

router.post("/:userId/remove", requireAuth, requireRole("MODERATOR", "ADMIN", "OWNER"), removeBalance);

export default router;