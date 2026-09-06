import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { getLore, getLoreEntry, createLoreEntry, updateLoreEntry, deleteLoreEntry } from "./lore.controller";

const router = Router();
router.get("/", getLore);
router.get("/:loreId", getLoreEntry);
router.post("/", requireAuth, requireRole("ADMIN", "OWNER"), createLoreEntry);
router.patch("/:loreId", requireAuth, requireRole("ADMIN", "OWNER"), updateLoreEntry);
router.delete("/:loreId", requireAuth, requireRole("ADMIN", "OWNER"), deleteLoreEntry);
export default router;
