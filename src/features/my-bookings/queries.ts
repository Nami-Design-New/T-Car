import 'server-only';
import { cache } from 'react';
import { bookingsApi } from '@/services/bookings.api';
import { protectedRead } from '@/services/http/session';
import { toAppError } from '@/shared/lib/errors';
import type { BookingDetailsView, UserBooking } from './model';

export function getMyBookings(): Promise<UserBooking[]> {
  return protectedRead(() => bookingsApi.getBookings());
}

/**
 * Null for an unknown id, so the page can call notFound(). A dead session signs
 * in again; other failures throw to error.tsx. Cached per request:
 * generateMetadata and the page share one read.
 */
export const getBookingDetails = cache((id: string): Promise<BookingDetailsView | null> =>
  protectedRead(async () => {
    try {
      return await bookingsApi.getBookingDetails(id);
    } catch (error) {
      const appError = toAppError(error);
      if (appError.kind === 'not_found') return null;
      throw appError;
    }
  })
);
