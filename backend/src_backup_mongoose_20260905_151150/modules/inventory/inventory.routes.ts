import { Router } from "express";
import {
  getInventory,
  getInventoryItem,
} from "./inventory.controller";

const router = Router();

router.get(
  "/:userId",
  getInventory
);

router.get(
  "/:userId/:itemId",
  getInventoryItem
);

export default router;