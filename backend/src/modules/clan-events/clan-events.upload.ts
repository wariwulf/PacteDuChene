import fs from "fs";
import path from "path";
import multer from "multer";

const directory = path.join(process.cwd(), "uploads", "clan-events");
fs.mkdirSync(directory, { recursive: true });
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, directory),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).slice(2,10)}${path.extname(file.originalname).toLowerCase()}`),
});
export const clanEventUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, ["image/jpeg","image/png","image/webp"].includes(file.mimetype)),
});
