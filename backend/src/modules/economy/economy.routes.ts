import { Router } from "express";
import {
  getBalances,
  addBalance,
  removeBalance,
  getHistory,
} from "./economy.controller";

import currenciesRoutes from "./currencies.routes";
import economyAdminRoutes from "./economy-admin.routes";
import { economyAdminService } from "./economy-admin.service";

const router = Router();

router.use("/currencies", currenciesRoutes);

/*
 * Administration économique :
 * authentification + rôle ADMIN ou OWNER dans le sous-routeur.
 */
router.use("/admin", economyAdminRoutes);

/*
 * Les taux sont lisibles par les pages membres et publiques.
 * Leur modification reste réservée à l'administration.
 */
router.get(
  "/exchange-rates",
  async (_req, res) => {
    try {
      const rates =
        await economyAdminService.getExchangeRates();

      return res.status(200).json({
        success: true,
        data: { rates },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Impossible de récupérer les taux.",
      });
    }
  }
);

router.get("/:userId", getBalances);
router.get("/:userId/history", getHistory);
router.post("/:userId/add", addBalance);
router.post("/:userId/remove", removeBalance);

export default router;
