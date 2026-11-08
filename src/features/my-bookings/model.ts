import {
  orderTabForStatus,
  type BookingEditRequest,
  type Order,
  type OrderStatus,
} from "@/features/orders";

export type BookingTab = "active" | "past";

/** Reads ?status= from the URL; anything else means the default, 'active'. */
export const parseBookingTab = (value: unknown): BookingTab =>
  value === "past" ? "past" : "active";

/** The bookings list for a status; 'active' is the default, so it needs no parameter. */
export const bookingsListPath = (status: BookingTab) =>
  status === "active" ? "/account/bookings" : "/account/bookings?status=past";

/** Which list a booking belongs to, e.g. for the details page's back link. */
export const bookingTabFor = (status: OrderStatus): BookingTab =>
  orderTabForStatus(status);

/** Pre-fills the edit request form from the booking. */
export function toEditRequest(booking: Order): BookingEditRequest {
  const startDate = new Date(booking.pickupAt);
  const endDate = new Date(booking.returnAt);
  const branchAddress = `${booking.branch.title} — ${booking.branch.address}`;
  const fromBranch = booking.deliveryType === "from_branch";

  return {
    startDate,
    endDate,
    time: booking.pickupAt.slice(11, 16),
    notes: booking.note ?? "",
    days: Math.max(
      1,
      Math.round((endDate.getTime() - startDate.getTime()) / 86400000),
    ),
    pricePerDay: booking.carPrice,
    subtotal: booking.price,
    vat: booking.taxValue,
    total: booking.finalPrice,
    pickupAddress: fromBranch
      ? branchAddress
      : (booking.pickupLocation.address ?? undefined),
    dropoffAddress: fromBranch
      ? branchAddress
      : (booking.deliveryLocation.address ?? undefined),
    pickupLocation: null,
    dropoffLocation: null,
  };
}
