import 'server-only';
import { bookingsApi } from '@/services/bookings.api';
import { toAppError } from '@/shared/lib/errors';
import type { BookingDetailsView, UserBooking } from './model';

export function getMyBookings(): Promise<UserBooking[]> {
  return bookingsApi.getBookings();
}

/** Null for an unknown id, so the page can call notFound(). Other failures throw to error.tsx. */
export async function getBookingDetails(id: string): Promise<BookingDetailsView | null> {
  try {
    return await bookingsApi.getBookingDetails(id);
  } catch (error) {
    const appError = toAppError(error);
    if (appError.kind === 'not_found') return null;
    throw appError;
  }
}
