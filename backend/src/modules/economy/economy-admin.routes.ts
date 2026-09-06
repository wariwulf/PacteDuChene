import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole, requirePermission } from "../../middleware/role.middleware";
import {
  adjustMembers,
  listMembersForAdjustment,
  getExchangeRates,
  updateExchangeRates,
} from "./economy-admin.controller";
import { SITE_PERMISSIONS } from "../../common/security/permissions";

const router = Router();

// Toute l'administration économique nécessite une authentification.
router.use(requireAuth);

// Les membres nécessaires aux opérations économiques sont accessibles
// uniquement aux utilisateurs disposant de la permission d'ajustement.
router.get(
  "/members",
  requirePermission(SITE_PERMISSIONS.ECONOMY_ADJUST),
  listMembersForAdjustment
);

// Les taux de change restent strictement réservés à ADMIN / OWNER.
router.get(
  "/exchange-rates",
  requireRole("ADMIN", "OWNER"),
  getExchangeRates
);

router.put(
  "/exchange-rates",
  requireRole("ADMIN", "OWNER"),
  updateExchangeRates
);

// Ajouter / retirer de la monnaie : ADMIN / OWNER et modérateurs autorisés.
router.post(
  "/adjust",
  requirePermission(SITE_PERMISSIONS.ECONOMY_ADJUST),
  adjustMembers
);

export default router;
