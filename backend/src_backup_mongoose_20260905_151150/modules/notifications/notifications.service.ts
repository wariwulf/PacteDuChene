
import { Notification } from "./notifications.model";
import type { NotificationType } from "./notifications.model";
import { UserRole } from "../../common/constants/roles";

export class NotificationsService {
  async create(data: {
    recipientId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }) {
    return Notification.create({
      ...data,
      read: false,
    });
  }

  async createForRoles(
    roles: Array<UserRole | string>,
    data: Omit<Parameters<NotificationsService["create"]>[0], "recipientId">
  ) {
    // Les destinataires ADMIN/OWNER sont récupérés à partir du modèle User.
    const { User } = await import("../users/user.model");
    const admins = await User.find({
      role: { $in: roles as UserRole[] },
      status: "ACTIVE",
    }).select("_id");

    return Promise.all(
      admins.map((admin) =>
        this.create({
          recipientId: String(admin._id),
          ...data,
        })
      )
    );
  }

  async getForUser(userId: string, unreadOnly = false) {
    return Notification.find({
      recipientId: userId,
      ...(unreadOnly ? { read: false } : {}),
    }).sort({ createdAt: -1 }).limit(100);
  }

  async unreadCount(userId: string) {
    return Notification.countDocuments({
      recipientId: userId,
      read: false,
    });
  }

  async markRead(userId: string, notificationId: string) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, recipientId: userId },
      { $set: { read: true, readAt: new Date() } },
      { new: true }
    );
  }

  async markAllRead(userId: string) {
    return Notification.updateMany(
      { recipientId: userId, read: false },
      { $set: { read: true, readAt: new Date() } }
    );
  }
}

export const notificationsService = new NotificationsService();
