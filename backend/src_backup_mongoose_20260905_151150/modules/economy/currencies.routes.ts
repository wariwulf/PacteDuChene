import { Router } from "express";
import {
  getCurrencies,
  getCurrency,
  createCurrency,
} from "./currencies.controller";

const router = Router();

/**
 * Monnaies officielles du Pacte :
 * - Solidus
 * - Argent
 * - Bronze
 */

router.get("/", getCurrencies);
router.get("/:currencyId", getCurrency);

/**
 * Cette route est conservée pour l'administration,
 * mais le controller n'autorise que les trois monnaies officielles.
 */
router.post("/", createCurrency);

export default router;
