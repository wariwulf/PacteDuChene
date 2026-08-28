import { Router } from "express";
import { getLore, getLoreEntry, createLoreEntry, updateLoreEntry, deleteLoreEntry } from "./lore.controller";

const router = Router();
router.get("/", getLore);
router.get("/:loreId", getLoreEntry);
router.post("/", createLoreEntry);
router.patch("/:loreId", updateLoreEntry);
router.delete("/:loreId", deleteLoreEntry);
export default router;
