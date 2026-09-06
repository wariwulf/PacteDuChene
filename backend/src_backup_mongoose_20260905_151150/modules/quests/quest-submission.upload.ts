import fs from "fs";
import path from "path";
import multer from "multer";
import type { Request } from "express";

const uploadDirectory = path.resolve(
  process.cwd(),
  "uploads",
  "quest-submissions"
);

fs.mkdirSync(uploadDirectory, {
  recursive: true,
});

const storage = multer.diskStorage({
  destination: (
    _req: Request,
    _file,
    cb
  ) => cb(null, uploadDirectory),

  filename: (
    _req: Request,
    file,
    cb
  ) => {
    const ext = path
      .extname(file.originalname)
      .toLowerCase();

    cb(
      null,
      `${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}${ext}`
    );
  },
});

const allowed = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
]);

export const questSubmissionUpload =
  multer({
    storage,
    limits: {
      fileSize: 50 * 1024 * 1024,
      files: 5,
    },
    fileFilter: (
      _req,
      file,
      cb
    ) => {
      if (!allowed.has(file.mimetype)) {
        return cb(
          new Error(
            "Format non autorisé. Utilisez JPG, PNG, WebP, MP4, WebM, MP3, WAV ou OGG."
          )
        );
      }

      cb(null, true);
    },
  });
