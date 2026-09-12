import { Router, type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import { requireAuth } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/role.middleware";
import {
  getQuests,
  getDeletedQuests,
  getQuest,
  restoreQuest,
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
  uploadQuestImage,
  uploadQuestStepImage,
} from "./quests.controller";
import { questSubmissionUpload } from "./quest-submission.upload";
import { questMediaUpload } from "./quest-media.upload";
import { SITE_PERMISSIONS } from "../../common/security/permissions";

const router = Router();

/**
 * Gestionnaire d'upload des médias de quêtes.
 * Multer s'exécute avant le contrôleur : ses erreurs doivent donc être
 * converties ici en réponses HTTP explicites plutôt qu'en 500 génériques.
 */
function questMediaUploadMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  questMediaUpload.single("image")(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          success: false,
          message: "L'image est trop volumineuse. La taille maximale autorisée est de 10 Mo.",
        });
      }

      return res.status(400).json({
        success: false,
        message: `Erreur lors de l'envoi de l'image (${error.code}).`,
      });
    }

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible d'envoyer l'image.",
    });
  });
}

router.use(requireAuth);

// ADMIN / MODERATOR / chefs de faction Discord
router.get(
  "/admin/deleted",
  requirePermission(SITE_PERMISSIONS.QUESTS_MANAGE),
  getDeletedQuests
);

router.post(
  "/admin/:questId/restore",
  requirePermission(SITE_PERMISSIONS.QUESTS_MANAGE),
  restoreQuest
);

router.get(
  "/admin/submissions",
  requirePermission(SITE_PERMISSIONS.QUESTS_MANAGE),
  getPendingSubmissions
);

router.get(
  "/admin/user/:userId",
  requirePermission(SITE_PERMISSIONS.QUESTS_MANAGE),
  getUserQuests
);

router.post(
  "/admin/submissions/:submissionId/review",
  requirePermission(SITE_PERMISSIONS.QUESTS_MANAGE),
  reviewSubmission
);

// Anciennes routes d'administration conservées pour compatibilité.
router.post(
  "/admin/:userId/:questId/objectives/:objectiveId/validate",
  requirePermission(SITE_PERMISSIONS.QUESTS_MANAGE),
  adminValidateObjective
);

router.post(
  "/admin/:userId/:questId/complete",
  requirePermission(SITE_PERMISSIONS.QUESTS_MANAGE),
  adminCompleteQuest
);

// MEMBER
router.get("/user", getUserQuests);
router.get("/user/:userId", getUserQuests);
router.get("/submissions/mine", getUserSubmissions);

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

// QUEST MEDIA
router.post(
  "/:questId/image",
  requirePermission(SITE_PERMISSIONS.QUESTS_MANAGE),
  questMediaUpload.single("image"),
  uploadQuestImage
);

router.post(
  "/:questId/steps/:stepId/image",
  requirePermission(SITE_PERMISSIONS.QUESTS_MANAGE),
  questMediaUpload.single("image"),
  uploadQuestStepImage
);

// QUESTS
router.get("/", getQuests);
router.get("/:questId", getQuest);

router.post(
  "/",
  requirePermission(SITE_PERMISSIONS.QUESTS_MANAGE),
  createQuest
);

router.put(
  "/:questId",
  requirePermission(SITE_PERMISSIONS.QUESTS_MANAGE),
  updateQuest
);

router.delete(
  "/:questId",
  requirePermission(SITE_PERMISSIONS.QUESTS_MANAGE),
  deleteQuest
);

export default router;
