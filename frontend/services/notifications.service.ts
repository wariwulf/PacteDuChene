
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function request<T>(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload?.success === false) {
    throw new Error(
      payload?.message || `Erreur serveur (${response.status})`
    );
  }

  return payload.data as T;
}

export interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  data?: Record<string, unknown>;
  createdAt?: string;
}

export async function getNotifications(unreadOnly = false) {
  const data = await request<{ notifications: NotificationItem[] }>(
    `/notifications?unreadOnly=${unreadOnly}`
  );
  return data.notifications;
}

export async function getUnreadNotificationCount() {
  const data = await request<{ count: number }>(
    "/notifications/unread-count"
  );
  return data.count;
}

export async function markNotificationRead(id: string) {
  return request(`/notifications/${id}/read`, { method: "PATCH" });
}

export async function markAllNotificationsRead() {
  return request("/notifications/read-all", { method: "POST" });
}
