import path from "path";
import fs from "fs";
import multer from "multer";
import type { Request } from "express";

const uploadDirectory = path.resolve(process.cwd(), "uploads", "avatars");
fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req: Request, _file, cb) => cb(null, uploadDirectory),
  filename: (_req: Request, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
  },
});

export const avatarUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Le portrait doit être une image JPG, PNG ou WebP."));
    }
    cb(null, true);
  },
});
