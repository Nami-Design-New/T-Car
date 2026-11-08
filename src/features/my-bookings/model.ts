import {
  isActiveBooking,
  type BookingDetailsView,
  type BookingEditRequest,
  type BookingStatus,
  type UserBooking,
} from "@/features/orders";

export type BookingTab = "active" | "past";

/** Reads ?status= from the URL; anything else means the default, 'active'. */
export const parseBookingTab = (value: unknown): BookingTab =>
  value === "past" ? "past" : "active";

/** The bookings list for a status; 'active' is the default, so it needs no parameter. */
export const bookingsListPath = (status: BookingTab) =>
  status === "active" ? "/account/bookings" : "/account/bookings?status=past";

/** Which list a booking belongs to, e.g. for the details page's back link. */
export const bookingTabFor = (status: BookingStatus): BookingTab =>
  isActiveBooking(status) ? "active" : "past";

export function cancellationFee(amount: number, percent: number): number {
  return Math.round((amount * percent) / 100);
}

/** Pre-fills the edit request form from the booking. */
export function toEditRequest(booking: BookingDetailsView): BookingEditRequest {
  const startDate = new Date(booking.pickupDateTime);
  const endDate = new Date(booking.dropoffDateTime);

  return {
    startDate,
    endDate,
    time: booking.pickupDateTime.slice(11, 16),
    notes: "",
    days: Math.max(
      1,
      Math.round((endDate.getTime() - startDate.getTime()) / 86400000),
    ),
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
