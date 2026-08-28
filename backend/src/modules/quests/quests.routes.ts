import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import {
  getQuests,
  getQuest,
  createQuest,
  updateQuest,
  deleteQuest,
  getUserQuests,
  startQuest,
  updateProgress,
  completeQuest,
  submitObjective,
  getPendingSubmissions,
  getUserSubmissions,
  reviewSubmission,
  adminValidateObjective,
  adminCompleteQuest,
} from "./quests.controller";
import { questSubmissionUpload } from "./quest-submission.upload";

const router = Router();

router.use(requireAuth);

// ADMIN
router.get(
  "/admin/submissions",
  requireRole("ADMIN", "OWNER"),
  getPendingSubmissions
);

router.get(
  "/admin/user/:userId",
  requireRole("ADMIN", "OWNER"),
  getUserQuests
);

router.post(
  "/admin/submissions/:submissionId/review",
  requireRole("ADMIN", "OWNER"),
  reviewSubmission
);

// Anciennes routes d'administration conservées pour compatibilité.
router.post(
  "/admin/:userId/:questId/objectives/:objectiveId/validate",
  requireRole("ADMIN", "OWNER"),
  adminValidateObjective
);

router.post(
  "/admin/:userId/:questId/complete",
  requireRole("ADMIN", "OWNER"),
  adminCompleteQuest
);

// MEMBER
router.get(
  "/user",
  getUserQuests
);

router.get(
  "/user/:userId",
  getUserQuests
);

router.get(
  "/submissions/mine",
  getUserSubmissions
);

router.post(
  "/user/:userId/:questId/start",
  startQuest
);

router.post(
  "/user/:userId/:questId/progress",
  updateProgress
);

router.post(
  "/user/:userId/:questId/objectives/:objectiveId/submit",
  questSubmissionUpload.array("files", 5),
  submitObjective
);

router.post(
  "/user/:userId/:questId/complete",
  completeQuest
);

// QUESTS
router.get("/", getQuests);
router.get("/:questId", getQuest);
router.post(
  "/",
  requireRole("ADMIN", "OWNER"),
  createQuest
);
router.put(
  "/:questId",
  requireRole("ADMIN", "OWNER"),
  updateQuest
);
router.delete(
  "/:questId",
  requireRole("ADMIN", "OWNER"),
  deleteQuest
);

export default router;
