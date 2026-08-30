import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";

import {
  getShops,
  getShop,
  createShop,
  addItem,
  buyItem,
} from "./shops.controller";

const router = Router();

/**
 * Boutiques
 */

// GET /api/shops
router.get("/", getShops);

// GET /api/shops/:shopId
router.get("/:shopId", getShop);

// POST /api/shops
router.post("/", requireAuth, requireRole("MODERATOR", "ADMIN", "OWNER"), createShop);

/**
 * Articles
 */

// POST /api/shops/:shopId/items
router.post("/:shopId/items", requireAuth, requireRole("MODERATOR", "ADMIN", "OWNER"), addItem);

/**
 * Achats
 */

// POST /api/shops/:shopId/items/:itemId/buy
router.post("/:shopId/items/:itemId/buy", buyItem);

export default router;