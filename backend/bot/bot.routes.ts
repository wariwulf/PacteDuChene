import { Router } from "express";
import { requireBotAuth } from "./bot.auth.middleware";
import {
  completeDiscordMembersSync,
  getBotHealth,
  getMemberByDiscordId,
  syncDiscordMember,
  claimDailyReward,
  rewardVoiceTick,
} from "./bot.controller";

const router = Router();
router.use(requireBotAuth);
router.get("/health", getBotHealth);
router.get("/members/by-discord/:discordId", getMemberByDiscordId);
router.post("/members/sync", syncDiscordMember);
router.post("/members/sync/complete", completeDiscordMembersSync);
router.post("/economy/daily/claim", claimDailyReward);

export default router;

router.post("/economy/rewards/voice/tick", rewardVoiceTick);
