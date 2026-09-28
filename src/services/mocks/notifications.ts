import type { AppNotification } from '@/features/notifications/model';
import { AppError } from '@/shared/lib/errors';
import type { NotificationsApi } from '../notifications.api';

const MOCK_NOTIFICATIONS: AppNotification[] = [
  { id: '1', title: 'قدم إليك العميل عرض جديد اذهب بسرعة للطلب', time: 'الآن', read: false },
  { id: '2', title: 'لقد استعدت إمكانية استخدام حسابك', time: 'الآن', read: false },
  { id: '3', title: 'يمكنك الآن الوصول إلى جميع المزايا، أحمد', time: 'قبل أسبوعين', read: true },
  { id: '4', title: 'تهانينا! تم تفعيل حسابك بنجاح، أحمد', time: 'قبل 3 أسابيع', read: true },
];

// Read-only, so it is safe to run on the server. The reserved account id
// `notifications-read-failure` deterministically exercises the read error path.
export const notificationsMock: NotificationsApi = {
  async listNotifications(accountId) {
    if (accountId === 'notifications-read-failure') throw new AppError('server');
    return MOCK_NOTIFICATIONS.map((notification) => ({ ...notification }));
  },
};
