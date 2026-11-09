import { BookingsTab, parseBookingTab } from '@/features/my-bookings';
import { getMyBookings } from '@/features/orders/queries';

interface Props {
  searchParams: Promise<{ status?: string | string[] }>;
}

export default async function BookingsPage({ searchParams }: Props) {
  const tab = parseBookingTab((await searchParams).status);
  const initialPage = await getMyBookings(tab);
  return <BookingsTab initialPage={initialPage} status={tab} />;
}
