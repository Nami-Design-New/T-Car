import { ResourceNotFound } from '@/shared/ui/ResourceNotFound';

export default function BookingNotFound() {
  return <ResourceNotFound resource="bookings" href="/account/bookings" />;
}
