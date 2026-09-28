import { AccountScreen, isAccountTab } from '@/features/account';
import { getProfile } from '@/features/account/queries';
import { BookingsTab } from '@/features/my-bookings';
import { getMyBookings } from '@/features/my-bookings/queries';
import { getNotifications } from '@/features/notifications/queries';

interface Props {
  searchParams: Promise<{ tab?: string | string[] }>;
}

export default async function AccountPage({ searchParams }: Props) {
  const { tab } = await searchParams;
  const [profile, notifications, bookings] = await Promise.all([
    getProfile(),
    getNotifications(),
    getMyBookings(),
  ]);

  return (
    <AccountScreen
      initialTab={isAccountTab(tab) ? tab : undefined}
      profile={profile}
      notifications={notifications}
      bookings={<BookingsTab bookings={bookings} />}
    />
  );
}
