import { BookingsTab } from '@/features/my-bookings';
import { getMyBookings } from '@/features/my-bookings/queries';

export default async function BookingsPage() {
  const bookings = await getMyBookings();
  return <BookingsTab bookings={bookings} />;
}
