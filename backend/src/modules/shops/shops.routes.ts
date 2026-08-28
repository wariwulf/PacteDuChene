import { Router } from "express";

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
router.post("/", createShop);

/**
 * Articles
 */

// POST /api/shops/:shopId/items
router.post("/:shopId/items", addItem);

/**
 * Achats
 */

// POST /api/shops/:shopId/items/:itemId/buy
router.post("/:shopId/items/:itemId/buy", buyItem);

export default router;