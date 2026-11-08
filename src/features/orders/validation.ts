import { z } from "zod";
import { bookingDetailsSchema } from "@/shared/lib/booking-validation";

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

/** Entered values for extending a booking; the service owns availability limits. */
export const extendBookingSchema = z.object({
  days: z
    .number({ error: "bookings.invalidExtendDays" })
    .int({ error: "bookings.invalidExtendDays" })
    .positive({ error: "bookings.invalidExtendDays" }),
});

/** Both the showroom and driver ratings are required and range from 1 to 5. */
export const bookingReviewSchema = z.object({
  showroomRating: z
    .number({ error: "bookings.ratingRequired" })
    .int({ error: "bookings.ratingRequired" })
    .min(1, { error: "bookings.ratingRequired" })
    .max(5, { error: "bookings.ratingRequired" }),
  driverRating: z
    .number({ error: "bookings.ratingRequired" })
    .int({ error: "bookings.ratingRequired" })
    .min(1, { error: "bookings.ratingRequired" })
    .max(5, { error: "bookings.ratingRequired" }),
});

/** Edit requests use the same normalized booking details as initial checkout. */
export const bookingEditSchema = bookingDetailsSchema;

export type CreateBookingValues = z.output<typeof createBookingSchema>;
export type BookingTermsValues = z.infer<typeof bookingTermsSchema>;
export type ExtendBookingFormValues = z.infer<typeof extendBookingSchema>;
export type BookingReviewFormValues = z.infer<typeof bookingReviewSchema>;
export type BookingEditFormValues = z.infer<typeof bookingEditSchema>;
