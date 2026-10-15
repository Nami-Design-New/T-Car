import { BookingsTab, parseBookingTab } from '@/features/my-bookings';
import { getMyBookings } from '@/features/my-bookings/queries';

interface Props {
  searchParams: Promise<{ status?: string | string[] }>;
}

export default async function BookingsPage({ searchParams }: Props) {
  const [{ status }, bookings] = await Promise.all([searchParams, getMyBookings()]);
  return <BookingsTab bookings={bookings} status={parseBookingTab(status)} />;
}
