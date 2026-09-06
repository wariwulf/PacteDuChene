import { Router } from "express";

import healthRoutes from "../modules/health/health.routes";
import authRoutes from "../modules/auth/auth.routes";
import newsRoutes from "../modules/news/news.routes";
import membersRoutes from "../modules/members/members.routes";
import { achievementsRoutes, } from "../modules/achievements";
import { questsRoutes, } from "../modules/quests";
import levelsRoutes from "../modules/levels/levels.routes";
import { economyRoutes } from "../modules/economy";
import notificationsRoutes from "../modules/notifications/notifications.routes";
import shopsRoutes from "../modules/shops/shops.routes";
import botRoutes from "../modules/bot/bot.routes";

const router = Router();

/**
 * News
 */
router.use("/news", newsRoutes);

/**
 * Health
 */
router.use("/health", healthRoutes);

/**
 * Authentification
 */
router.use("/auth", authRoutes);

/**
 * Membres
 */
router.use("/members", membersRoutes);

/**
 * Quêtes
 */
router.use("/quests", questsRoutes);

/**
 * Succès
 */
router.use("/achievements", achievementsRoutes);

/**
 * Économie
 */
router.use("/economy", economyRoutes);

/**
 * Boutiques
 */
router.use("/shops", shopsRoutes);

/**
 * Level
 */
router.use("/levels", levelsRoutes);

/**
 * Notifications
 */
router.use("/notifications", notificationsRoutes);

router.use("/internal/bot", botRoutes);

export default router;