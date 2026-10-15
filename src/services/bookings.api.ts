import type { CreateBookingRequest } from '@/features/booking/model';
import type {
  BookingDetailsView,
  BookingEditRequest,
  BookingReviewInput,
  UserBooking,
} from '@/features/my-bookings/model';
import { bookingsMock } from './mocks/bookings';

export interface BookingsApi {
  getBookings(): Promise<UserBooking[]>;
  /** Throws a `not_found` AppError for an unknown id. */
  getBookingDetails(id: string): Promise<BookingDetailsView>;
  /** `days` is the new total rental length. */
  extendBooking(id: string, days: number): Promise<void>;
  requestBookingEdit(id: string, request: BookingEditRequest): Promise<void>;
  cancelBooking(id: string): Promise<void>;
  submitReview(id: string, input: BookingReviewInput): Promise<void>;
  createBooking(request: CreateBookingRequest): Promise<void>;
}

// The booking endpoints are not available yet, so the mock is the only
// implementation. Add the http one here (see cars.api.ts) and pick between the
// two with an env flag once they exist; callers stay unchanged.
export const bookingsApi: BookingsApi = bookingsMock;
