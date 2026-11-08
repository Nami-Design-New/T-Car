export { bookingDetailsSchema, BOOKING_LIMITS, TIME_SLOTS } from "@/shared/lib/booking-validation";
export type {
  BookingDetailsFormValues,
  BookingDetailsValues,
  BookingLocation,
} from "@/shared/lib/booking-validation";
export {
  bookingTermsSchema,
  createBookingSchema,
  paymentMethodSchema,
} from "@/features/orders";
export type {
  BookingTermsValues,
  CreateBookingValues,
} from "@/features/orders";
