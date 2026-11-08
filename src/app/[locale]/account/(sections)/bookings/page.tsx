import { BookingsTab, parseBookingTab } from '@/features/my-bookings';
import { getMyBookings, getMyBookingsTotal } from '@/features/orders/queries';

interface Props {
  searchParams: Promise<{ status?: string | string[] }>;
}

export default async function BookingsPage({ searchParams }: Props) {
  const tab = parseBookingTab((await searchParams).status);
  const other = tab === 'active' ? 'past' : 'active';
  // The list endpoint returns one tab's total, so the other tab's count is a
  // one-item read of that tab.
  const [initialPage, otherTotal] = await Promise.all([getMyBookings(tab), getMyBookingsTotal(other)]);
  const counts = tab === 'active'
    ? { activeCount: initialPage.total, pastCount: otherTotal }
    : { activeCount: otherTotal, pastCount: initialPage.total };
  return <BookingsTab initialPage={initialPage} status={tab} {...counts} />;
}
