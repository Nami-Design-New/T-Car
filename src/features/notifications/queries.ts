import "server-only";
import { protectedRead } from "@/services/http/session";
import {
  getNotifications as readNotifications,
  getUnreadNotificationCount as readUnreadNotificationCount,
} from "./api";
import type { NotificationsData } from "./model";

/** Also read by the layout for a session: a dead token signs the visitor in again from any page. */
export function getNotifications(page = 1): Promise<NotificationsData> {
  return protectedRead(() => readNotifications(page));
}

/** Used by the layout so its notification badge does not load the full list. */
export function getUnreadNotificationCount(): Promise<number> {
  return protectedRead(readUnreadNotificationCount);
}
