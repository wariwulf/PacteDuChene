import { Router } from "express";
import { AuthController } from "./auth.controller";
import { requireAuth } from "../../middleware/auth.middleware";

const router = Router();
const controller = new AuthController();

router.post("/register", (req, res) =>
  controller.register(req, res)
);

router.post("/login", (req, res) =>
  controller.login(req, res)
);

router.post("/logout", (req, res) =>
  controller.logout(req, res)
);

router.get("/discord", (req, res) =>
  controller.startDiscordOAuth(req, res)
);

router.get("/discord/callback", (req, res) =>
  controller.discordOAuthCallback(req, res)
);

router.get("/me", requireAuth, (req, res) =>
  controller.me(req, res)
);

export default router;
