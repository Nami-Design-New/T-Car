import { NotificationsTab } from "@/features/notifications";
import { getNotifications } from "@/features/notifications/queries";

export default async function NotificationsPage() {
  const { page } = await getNotifications();
  return <NotificationsTab initialPage={page} />;
}
