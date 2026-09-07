import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { getLore, getLoreEntry, createLoreEntry, updateLoreEntry, deleteLoreEntry, uploadLoreImage } from "./lore.controller";

const router = Router();

const loreUploadDirectory = path.join(process.cwd(), "uploads", "lore");
fs.mkdirSync(loreUploadDirectory, { recursive: true });

const loreUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, loreUploadDirectory),
    filename: (_req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase();
      callback(null, `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${extension}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.mimetype)) {
      return callback(new Error("Format d’image non pris en charge. Utilisez JPG, PNG, WEBP ou GIF."));
    }
    callback(null, true);
  },
});

router.get("/", getLore);
router.get("/:loreId", getLoreEntry);
router.post("/upload-image", requireAuth, requireRole("ADMIN", "OWNER"), loreUpload.single("image"), uploadLoreImage);
router.post("/", requireAuth, requireRole("ADMIN", "OWNER"), createLoreEntry);
router.patch("/:loreId", requireAuth, requireRole("ADMIN", "OWNER"), updateLoreEntry);
router.delete("/:loreId", requireAuth, requireRole("ADMIN", "OWNER"), deleteLoreEntry);
export default router;
