import { Router } from "express";
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

router.post("/:userId/add", addBalance);

router.post("/:userId/remove", removeBalance);

export default router;