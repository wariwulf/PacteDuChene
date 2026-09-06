import { Router } from "express";

import {
  getNews,
  getNewsBySlug,
  createNews,
  updateNews,
} from "./news.controller";

import { requireAuth } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/role.middleware";
import { SITE_PERMISSIONS } from "../../common/security/permissions";

const router = Router();

// Routes publiques
router.get("/", getNews);
router.get("/:slug", getNewsBySlug);

// Routes d'administration
router.post(
  "/",
  requireAuth,
  requirePermission(SITE_PERMISSIONS.NEWS_MANAGE),
  createNews
);

router.put(
  "/:id",
  requireAuth,
  requirePermission(SITE_PERMISSIONS.NEWS_MANAGE),
  updateNews
);

export default router;
