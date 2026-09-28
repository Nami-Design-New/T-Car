import { notFound } from 'next/navigation';
import { BookingDetailsScreen, getBookingDetails } from '@/features/my-bookings';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BookingDetailsPage({ params }: Props) {
  const { id } = await params;
  const booking = await getBookingDetails(id);
  if (!booking) notFound();

  return <BookingDetailsScreen booking={booking} />;
}
