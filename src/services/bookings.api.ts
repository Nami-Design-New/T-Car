import type { BookingDetailsView, UserBooking } from '@/features/my-bookings/model';
import { bookingsMock } from './mocks/bookings';

export interface BookingsApi {
  getBookings(): Promise<UserBooking[]>;
  /** Throws a `not_found` AppError for an unknown id. */
  getBookingDetails(id: string): Promise<BookingDetailsView>;
}

// The booking endpoints are not available yet, so the mock is the only
// implementation. Add the http one here (see cars.api.ts) and pick between the
// two with an env flag once they exist; callers stay unchanged.
export const bookingsApi: BookingsApi = bookingsMock;
