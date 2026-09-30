import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BookingDetailsScreen } from '@/features/my-bookings';
import { getBookingDetails } from '@/features/my-bookings/queries';

interface Props {
  params: Promise<{ id: string }>;
}

/** The booking's own title; the query is cached, so the page reuses this read. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const booking = await getBookingDetails(id);
  if (!booking) notFound();

  return { title: `#${booking.reference}` };
}

export default async function BookingDetailsPage({ params }: Props) {
  const { id } = await params;
  const booking = await getBookingDetails(id);
  if (!booking) notFound();

  return <BookingDetailsScreen booking={booking} />;
}
