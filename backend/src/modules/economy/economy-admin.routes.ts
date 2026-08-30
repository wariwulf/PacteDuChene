import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import {
  adjustMembers,
  getExchangeRates,
  updateExchangeRates,
} from "./economy-admin.controller";

const router = Router();

router.use(
  requireAuth,
  requireRole("ADMIN", "OWNER")
);

router.get("/exchange-rates", getExchangeRates);
router.put("/exchange-rates", updateExchangeRates);
router.post("/adjust", adjustMembers);

export default router;
