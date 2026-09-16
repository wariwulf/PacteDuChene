import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireBotAuth } from "../bot/bot.auth.middleware";
import * as controller from "./factions.controller";

const router = Router();
router.get("/", requireAuth, controller.listFactions);
router.get("/membership", requireAuth, controller.membership);
router.get("/orders/mine", requireAuth, controller.listMine);
router.get("/orders/:orderId", requireAuth, controller.getOrder);
router.get("/:factionId", requireAuth, controller.getFaction);
router.get("/:factionId/orders", requireAuth, controller.listOrders);
router.post("/:factionId/orders", requireAuth, controller.createOrder);
router.patch("/orders/:orderId/status", requireAuth, controller.updateStatus);
router.patch("/:factionId", requireAuth, controller.updateFaction);

const bot = Router();
bot.use(requireBotAuth);
bot.get("/pending-orders", controller.botPendingOrders);
bot.get("/active-orders", controller.botActiveOrders);
bot.get("/factions", controller.botFactions);
bot.post("/orders/:orderId/discord", controller.botAttachDiscord);
bot.post("/orders/:orderId/archive", controller.botArchiveOrder);

export { router as factionsRoutes, bot as factionsBotRoutes };
