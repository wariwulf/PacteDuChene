import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
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

const router = Router();

router.use(requireAuth);

// ADMIN / OWNER
router.get(
  "/admin/submissions",
  requireRole("ADMIN", "OWNER"),
  getPendingAchievementSubmissions
);

router.post(
  "/admin/submissions/:submissionId/review",
  requireRole("ADMIN", "OWNER"),
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
  requireRole("ADMIN", "OWNER"),
  unlockAchievement
);

// ADMIN / OWNER - gestion des exploits
router.post(
  "/",
  requireRole("MODERATOR", "ADMIN", "OWNER"),
  createAchievement
);

router.put(
  "/:achievementId",
  requireRole("MODERATOR", "ADMIN", "OWNER"),
  updateAchievement
);

router.get("/:achievementId", getAchievement);
router.get("/", getAchievements);

export default router;
