import { z } from "zod";
import { bookingDetailsSchema } from "@/shared/lib/booking-validation";

export { bookingDetailsSchema, BOOKING_LIMITS, TIME_SLOTS } from "@/shared/lib/booking-validation";
export type {
  BookingDetailsFormValues,
  BookingDetailsValues,
  BookingLocation,
} from "@/shared/lib/booking-validation";
export const paymentMethodSchema = z.enum(
  ["wallet", "visa", "tabby", "tamara"],
  {
    error: "booking.paymentMethodRequired",
  },
);

export const bookingTermsSchema = z.object({
  termsAccepted: z
    .boolean()
    .refine((value) => value, { error: "booking.termsRequired" }),
});

export const createBookingSchema = z.object({
  carId: z
    .string({ error: "booking.carRequired" })
    .trim()
    .min(1, { error: "booking.carRequired" }),
  details: bookingDetailsSchema,
  paymentMethod: paymentMethodSchema,
  termsAccepted: bookingTermsSchema.shape.termsAccepted,
});

export type CreateBookingValues = z.output<typeof createBookingSchema>;
export type BookingTermsValues = z.infer<typeof bookingTermsSchema>;
