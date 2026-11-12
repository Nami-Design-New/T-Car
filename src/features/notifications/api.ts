import { serverHttp } from "@/services/http/server";
import { AppError } from "@/shared/lib/errors";
import { fail, ok, type Result } from "@/shared/lib/result";
import {
  isApiEnvelope,
  type ApiEnvelope,
  type ApiPagination,
} from "@/services/http/envelope";
import { toPage } from "@/shared/lib/pagination";
import type { AppNotification, NotificationsData } from "./model";

interface NotificationDto {
  id: number;
  title: string;
  message: string;
  action: string | null;
  order_id: number | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationsDto {
  notifications: NotificationDto[];
  unread_count: number;
  pagination: ApiPagination;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

function isNotificationDto(value: unknown): value is NotificationDto {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    Number.isInteger(value.id) &&
    typeof value.title === "string" &&
    typeof value.message === "string" &&
    (typeof value.action === "string" || value.action === null) &&
    (typeof value.order_id === "number" || value.order_id === null) &&
    typeof value.is_read === "boolean" &&
    typeof value.created_at === "string"
  );
}

function isPagination(value: unknown): value is ApiPagination {
  return (
    isRecord(value) &&
    typeof value.current_page === "number" &&
    typeof value.last_page === "number" &&
    typeof value.per_page === "number" &&
    typeof value.total === "number" &&
    (typeof value.from === "number" || value.from === null) &&
    (typeof value.to === "number" || value.to === null)
  );
}

function isNotificationsDto(value: unknown): value is NotificationsDto {
  return (
    isRecord(value) &&
    Array.isArray(value.notifications) &&
    value.notifications.every(isNotificationDto) &&
    typeof value.unread_count === "number" &&
    Number.isInteger(value.unread_count) &&
    value.unread_count >= 0 &&
    isPagination(value.pagination)
  );
}

function toNotification(notification: NotificationDto): AppNotification {
  return {
    id: String(notification.id),
    title: notification.title,
    message: notification.message,
    action: notification.action,
    orderId:
      notification.order_id === null ? null : String(notification.order_id),
    createdAt: notification.created_at,
    read: notification.is_read,
  };
}

/** Validates and maps the paginated notification read response. */
export function mapNotificationsResponse(value: unknown): NotificationsData {
  if (
    !isApiEnvelope(value) ||
    value.code !== 200 ||
    !isNotificationsDto(value.data)
  ) {
    throw new AppError("server");
  }

  return {
    page: toPage(
      value.data.notifications.map(toNotification),
      value.data.pagination,
    ),
    unreadCount: value.data.unread_count,
  };
}

/** Validates the lightweight unread-count endpoint. */
export function mapUnreadCountResponse(value: unknown): number {
  if (
    !isApiEnvelope(value) ||
    value.code !== 200 ||
    !isRecord(value.data) ||
    typeof value.data.unread_count !== "number" ||
    !Number.isInteger(value.data.unread_count) ||
    value.data.unread_count < 0
  ) {
    throw new AppError("server");
  }
  return value.data.unread_count;
}

export const NOTIFICATIONS_PER_PAGE = 10;

export async function getNotifications(page = 1): Promise<NotificationsData> {
  if (!Number.isInteger(page) || page < 1) throw new AppError("validation");
  const response = await serverHttp.get<ApiEnvelope<unknown>>(
    "/notifications",
    {
      query: { per_page: NOTIFICATIONS_PER_PAGE, page },
    },
  );
  return mapNotificationsResponse(response);
}

export async function getUnreadNotificationCount(): Promise<number> {
  const response = await serverHttp.get<ApiEnvelope<unknown>>(
    "/notifications/unread-count",
  );
  return mapUnreadCountResponse(response);
}

async function write(
  request: () => Promise<ApiEnvelope<unknown>>,
): Promise<Result<void>> {
  try {
    const response = await request();
    if (
      !isApiEnvelope(response) ||
      response.code < 200 ||
      response.code >= 300
    ) {
      throw new AppError("server");
    }
    return ok(undefined, response.message);
  } catch (error) {
    return fail(error);
  }
}

export const markNotificationRead = (id: string) =>
  write(() =>
    serverHttp.post<ApiEnvelope<unknown>>(`/notifications/${id}/read`),
  );

export const markAllNotificationsRead = () =>
  write(() => serverHttp.post<ApiEnvelope<unknown>>("/notifications/read-all"));

export const deleteNotification = (id: string) =>
  write(() => serverHttp.delete<ApiEnvelope<unknown>>(`/notifications/${id}`));

export const deleteAllNotifications = () =>
  write(() => serverHttp.delete<ApiEnvelope<unknown>>("/notifications"));

/** Registers this browser with the backend after Firebase creates its FCM token. */
export const storeFirebaseToken = (token: string, language: "ar" | "en") =>
  write(() => {
    const body = new FormData();
    body.set("token", token);
    body.set("lang", language);
    body.set("platform", "web");
    return serverHttp.post<ApiEnvelope<unknown>>("/firebase-token", body);
  });
