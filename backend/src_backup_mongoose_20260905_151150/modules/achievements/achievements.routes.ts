import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/role.middleware";
import {
  createAchievement,
  getAchievement,
  getAchievements,
  getMyAchievementSubmissions,
  getPendingAchievementSubmissions,
  getUserAchievements,
  getFeaturedUserAchievements,
  setMyFeaturedAchievements,
  reviewAchievementSubmission,
  submitAchievement,
  unlockAchievement,
  updateAchievement,
} from "./achievements.controller";
import { achievementSubmissionUpload } from "./achievement-submission.upload";
import { SITE_PERMISSIONS } from "../../common/security/permissions";

const router = Router();

router.use(requireAuth);

// ADMIN / MODERATOR / chefs de faction Discord
router.get(
  "/admin/submissions",
  requirePermission(SITE_PERMISSIONS.ACHIEVEMENTS_MANAGE),
  getPendingAchievementSubmissions
);

router.post(
  "/admin/submissions/:submissionId/review",
  requirePermission(SITE_PERMISSIONS.ACHIEVEMENTS_MANAGE),
  reviewAchievementSubmission
);

// MEMBRE
router.get("/user/:userId/featured", getFeaturedUserAchievements);
router.put("/user/me/featured", setMyFeaturedAchievements);
router.get("/user/:userId", getUserAchievements);
router.get(
  "/user/:userId/submissions",
  getMyAchievementSubmissions
);

router.post(
  "/user/:userId/:achievementId/submit",
  achievementSubmissionUpload.array("files", 5),
  submitAchievement
);

// Legacy/manual unlock endpoint. Quest-linked exploits are rejected here;
// they can only be unlocked by the quest completion workflow.
router.post(
  "/user/:userId/:achievementId/unlock",
  requirePermission(SITE_PERMISSIONS.ACHIEVEMENTS_MANAGE),
  unlockAchievement
);

// Gestion des exploits
router.post(
  "/",
  requirePermission(SITE_PERMISSIONS.ACHIEVEMENTS_MANAGE),
  createAchievement
);

router.put(
  "/:achievementId",
  requirePermission(SITE_PERMISSIONS.ACHIEVEMENTS_MANAGE),
  updateAchievement
);

router.get("/:achievementId", getAchievement);
router.get("/", getAchievements);

export default router;
