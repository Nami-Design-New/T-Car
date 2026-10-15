import type { AppNotification } from '@/features/notifications/model';
import { notificationsMock } from './mocks/notifications';

export interface NotificationsApi {
  listNotifications(accountId: string): Promise<AppNotification[]>;
}

// The notifications endpoints are not available yet, so the read-only mock is
// the only implementation. Add the HTTP implementation here once they exist.
export const notificationsApi: NotificationsApi = notificationsMock;
