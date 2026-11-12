export interface AppNotification {
  id: string;
  title: string;
  message: string;
  action: string | null;
  orderId: string | null;
  createdAt: string;
  read: boolean;
}

export interface NotificationsData {
  page: Page<AppNotification>;
  unreadCount: number;
}
import type { Page } from "@/shared/lib/pagination";
