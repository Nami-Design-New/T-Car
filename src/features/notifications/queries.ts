import 'server-only';
import { protectedRead } from '@/services/http/session';
import { notificationsApi } from '@/services/notifications.api';
import type { AppNotification } from './model';

const CURRENT_ACCOUNT_ID = 'current';

/** Also read by the layout for a session: a dead token signs the visitor in again from any page. */
export function getNotifications(): Promise<AppNotification[]> {
  return protectedRead(() => notificationsApi.listNotifications(CURRENT_ACCOUNT_ID));
}
