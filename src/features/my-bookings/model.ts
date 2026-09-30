import type { StaticImageData } from 'next/image';
import type { BookingDetails } from '@/features/booking';

export type BookingStatus = 'current' | 'upcoming' | 'late' | 'completed' | 'cancelled';

export type BookingTab = 'active' | 'past';

/** Reads ?status= from the URL; anything else means the default, 'active'. */
export const parseBookingTab = (value: unknown): BookingTab => (value === 'past' ? 'past' : 'active');

/** The bookings list for a status; 'active' is the default, so it needs no parameter. */
export const bookingsListPath = (status: BookingTab) =>
  status === 'active' ? '/account/bookings' : '/account/bookings?status=past';

/** Which list a booking belongs to, e.g. for the details page's back link. */
export const bookingTabFor = (status: BookingStatus): BookingTab =>
  isActiveBooking(status) ? 'active' : 'past';

export interface UserBooking {
  id: string;
  carName: string;
  carBrand: string;
  carImage: string | StaticImageData;
  showroom: string;
  year: number;
  rating: number;
  status: BookingStatus;
  statusLabel: string;
  dateLabel: string;
}

export interface BookingDetailsView {
  id: string;
  reference: string;
  carName: string;
  carBrand: string;
  carImage: string | StaticImageData;
  showroom: string;
  status: BookingStatus;
  statusLabel: string;
  pricePerDay: number;
  originalPrice?: number;
  pickupDateTime: string;
  dropoffDateTime: string;
  pickupLocation: string;
  dropoffLocation: string;
  warrantyNote: string;
  pointsUsed: number;
  days: number;
  subtotal: number;
  vatRate: number;
  vat: number;
  total: number;
  /** Share of the total kept as a fee when the customer cancels. */
  cancellationPercent: number;
  bannerTimestamp?: string;
}

/** What the edit request form submits; the same shape the booking form uses. */
export type BookingEditRequest = BookingDetails;

export interface BookingReviewInput {
  /** 1 to 5 */
  rating: number;
  review: string;
}

const ACTIVE_STATUSES: readonly BookingStatus[] = ['current', 'upcoming', 'late'];

/** Not finished yet: the customer can still edit, extend, or cancel it. */
export const isActiveBooking = (status: BookingStatus) => ACTIVE_STATUSES.includes(status);

/** The car is out with the customer, so the return countdown applies. */
export const isRentalRunning = (status: BookingStatus) => status === 'current' || status === 'late';

export function cancellationFee(amount: number, percent: number): number {
  return Math.round((amount * percent) / 100);
}

/** Pre-fills the edit request form from the booking. */
export function toEditRequest(booking: BookingDetailsView): BookingEditRequest {
  return {
    startDate: new Date(booking.pickupDateTime),
    endDate: new Date(booking.dropoffDateTime),
    time: booking.pickupDateTime.slice(11, 16),
    notes: '',
    days: booking.days,
    pricePerDay: booking.pricePerDay,
    subtotal: booking.subtotal,
    vat: booking.vat,
    total: booking.total,
    pickupAddress: booking.pickupLocation,
    dropoffAddress: booking.dropoffLocation,
    pickupLocation: null,
    dropoffLocation: null,
  };
}

export function splitBookings(bookings: UserBooking[]) {
  return {
    active: bookings.filter((booking) => isActiveBooking(booking.status)),
    past: bookings.filter((booking) => !isActiveBooking(booking.status)),
  };
}
