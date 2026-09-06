
import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "./notifications.controller";

const router = Router();

router.use(requireAuth);
router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/:notificationId/read", markNotificationRead);
router.post("/read-all", markAllNotificationsRead);

export default router;
