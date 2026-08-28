import { Router } from "express";

import {
  getNews,
  getNewsBySlug,
  createNews,
  updateNews,
} from "./news.controller";

import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";

const router = Router();

// Routes publiques
router.get("/", getNews);
router.get("/:slug", getNewsBySlug);

// Routes d'administration
router.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "OWNER"),
  createNews
);

router.put(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "OWNER"),
  updateNews
);


export default router;