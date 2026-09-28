import { notFound } from 'next/navigation';
import { BookingDetailsScreen } from '@/features/my-bookings';
import { getBookingDetails } from '@/features/my-bookings/queries';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BookingDetailsPage({ params }: Props) {
  const { id } = await params;
  const booking = await getBookingDetails(id);
  if (!booking) notFound();

  return <BookingDetailsScreen booking={booking} />;
}
