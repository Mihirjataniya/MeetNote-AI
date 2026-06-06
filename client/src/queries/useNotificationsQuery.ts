import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  deleteNotification,
  type NotificationItem,
  type NotificationsPageResponse,
} from "../services/notifications";

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (page: number, limit: number) =>
    ["notifications", "list", page, limit] as const,
  unread: () => ["notifications", "unread"] as const,
};

export function useNotifications(page = 1, limit = 20) {
  return useQuery({
    queryKey: notificationKeys.list(page, limit),
    queryFn: () => fetchNotifications(page, limit),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unread(),
    queryFn: fetchUnreadCount,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: notificationKeys.all });
      const now = new Date().toISOString();
      qc.setQueriesData<NotificationsPageResponse>(
        { queryKey: ["notifications", "list"] },
        (old) =>
          old
            ? {
                ...old,
                notifications: old.notifications.map((n) =>
                  n.id === id && !n.readAt ? { ...n, readAt: now } : n
                ),
                unread: Math.max(
                  0,
                  old.unread -
                    (old.notifications.find((n) => n.id === id)?.readAt
                      ? 0
                      : 1)
                ),
              }
            : old
      );
      qc.setQueryData<number>(notificationKeys.unread(), (n) =>
        typeof n === "number" ? Math.max(0, n - 1) : n
      );
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: notificationKeys.all });
      const now = new Date().toISOString();
      qc.setQueriesData<NotificationsPageResponse>(
        { queryKey: ["notifications", "list"] },
        (old) =>
          old
            ? {
                ...old,
                notifications: old.notifications.map((n) =>
                  n.readAt ? n : { ...n, readAt: now }
                ),
                unread: 0,
              }
            : old
      );
      qc.setQueryData<number>(notificationKeys.unread(), 0);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteNotification,
    onSettled: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export type { NotificationItem };
