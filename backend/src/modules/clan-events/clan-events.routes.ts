import { Router, type NextFunction, type Response } from "express";
import { clanEventUpload } from "./clan-events.upload";
import { requireAuth, type AuthenticatedRequest } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/role.middleware";
import { SITE_PERMISSIONS } from "../../common/security/permissions";
import {
  listUpcoming, getEvent, setParticipation, removeParticipation,
  listAdmin, createAdmin, updateAdmin, syncDiscord, deleteAdmin,
  listAdminMembers, listAdminParticipants, addAdminParticipant, removeAdminParticipant,
  setAdminAttendance, setAdminObjectiveValidation,
  botActions, botActive, botEvent, botPublished, botReminderSent, botCleanupComplete,
  botParticipation, botGrantRewards, uploadImage,
} from "./clan-events.controller";

const router = Router();

function requireEventManager(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const role = String(req.user?.role ?? "").toUpperCase();
  if (role === "OWNER" || role === "ADMIN") return next();
  return res.status(403).json({ success:false, message:"Vous n'avez pas la permission de gérer les événements." });
}

function requireBot(req: any, res: Response, next: NextFunction) {
  const expected = process.env.PACTE_BOT_API_KEY?.trim();
  const authorization = String(req.headers.authorization ?? "");
  const supplied = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!expected || !supplied || supplied !== expected) return res.status(401).json({ success:false, message:"Bot non autorisé." });
  return next();
}

const eventManageAccess = [requireAuth, requirePermission(SITE_PERMISSIONS.CLAN_EVENTS_MANAGE)];
const eventDeleteAccess = [requireAuth, requireEventManager];
const botAccess = [requireBot];

router.get("/admin/all", ...eventManageAccess, listAdmin);
router.post("/admin", ...eventManageAccess, createAdmin);
router.patch("/admin/:eventId", ...eventManageAccess, updateAdmin);
router.post("/admin/:eventId/sync-discord", ...eventManageAccess, syncDiscord);
router.delete("/admin/:eventId", ...eventDeleteAccess, deleteAdmin);
router.post("/admin/:eventId/image", ...eventManageAccess, clanEventUpload.single("image"), uploadImage);

router.get("/admin/:eventId/members", ...eventManageAccess, listAdminMembers);
router.get("/admin/:eventId/participants", ...eventManageAccess, listAdminParticipants);
router.post("/admin/:eventId/participants", ...eventManageAccess, addAdminParticipant);
router.delete("/admin/:eventId/participants/:memberId", ...eventManageAccess, removeAdminParticipant);
router.patch("/admin/:eventId/participants/:memberId/attendance", ...eventManageAccess, setAdminAttendance);
router.patch("/admin/:eventId/objectives/:objectiveId", ...eventManageAccess, setAdminObjectiveValidation);

router.get("/internal/bot/actions", ...botAccess, botActions);
router.get("/internal/bot/active", ...botAccess, botActive);
router.get("/internal/bot/:eventId", ...botAccess, botEvent);
router.post("/internal/bot/:eventId/published", ...botAccess, botPublished);
router.post("/internal/bot/:eventId/reminder-sent", ...botAccess, botReminderSent);
router.post("/internal/bot/:eventId/cleanup-complete", ...botAccess, botCleanupComplete);
router.post("/internal/bot/:eventId/participation", ...botAccess, botParticipation);
router.post("/internal/bot/:eventId/grant-rewards", ...botAccess, botGrantRewards);

router.get("/upcoming", requireAuth, listUpcoming);
router.get("/:eventId", requireAuth, getEvent);
router.post("/:eventId/participation", requireAuth, setParticipation);
router.delete("/:eventId/participation", requireAuth, removeParticipation);

export default router;
