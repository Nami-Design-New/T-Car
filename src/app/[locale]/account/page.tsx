import AccountScreen from '@components/account/AccountScreen';
import { isAccountTab } from '@components/account/tabs';
import { BookingsTab } from '@/features/my-bookings';
import { getMyBookings } from '@/features/my-bookings/queries';

interface Props {
  searchParams: Promise<{ tab?: string | string[] }>;
}

export default async function AccountPage({ searchParams }: Props) {
  const { tab } = await searchParams;
  const bookings = await getMyBookings();

  return (
    <AccountScreen
      initialTab={isAccountTab(tab) ? tab : undefined}
      bookings={<BookingsTab bookings={bookings} />}
    />
  );
}
