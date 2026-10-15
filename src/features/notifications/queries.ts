import 'server-only';
import { notificationsApi } from '@/services/notifications.api';
import type { AppNotification } from './model';

const CURRENT_ACCOUNT_ID = 'current';

export function getNotifications(): Promise<AppNotification[]> {
  return notificationsApi.listNotifications(CURRENT_ACCOUNT_ID);
}
