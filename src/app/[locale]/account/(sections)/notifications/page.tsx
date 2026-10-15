import { NotificationsTab } from '@/features/notifications';
import { getNotifications } from '@/features/notifications/queries';

export default async function NotificationsPage() {
  const notifications = await getNotifications();
  return <NotificationsTab notifications={notifications} />;
}
