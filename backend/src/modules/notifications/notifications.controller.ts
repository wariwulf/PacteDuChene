
import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware";
import { notificationsService } from "./notifications.service";

export async function getNotifications(req: AuthenticatedRequest, res: Response) {
  try {
    const notifications = await notificationsService.getForUser(
      req.user!.id,
      req.query.unreadOnly === "true"
    );
    return res.json({ success: true, data: { notifications } });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Impossible de récupérer les notifications.",
    });
  }
}

export async function getUnreadCount(req: AuthenticatedRequest, res: Response) {
  try {
    const count = await notificationsService.unreadCount(req.user!.id);
    return res.json({ success: true, data: { count } });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Impossible de récupérer les notifications.",
    });
  }
}

export async function markNotificationRead(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const notification = await notificationsService.markRead(
      req.user!.id,
      String(req.params.notificationId)
    );
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification introuvable.",
      });
    }
    return res.json({ success: true, data: { notification } });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Impossible de modifier la notification.",
    });
  }
}

export async function markAllNotificationsRead(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    await notificationsService.markAllRead(req.user!.id);
    return res.json({ success: true });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Impossible de modifier les notifications.",
    });
  }
}
