import { z } from "zod";
import { bookingDetailsSchema } from "@/shared/lib/booking-validation";

const MAX_REVIEW_LENGTH = 1000;

/** Entered values for extending a booking; the service owns availability limits. */
export const extendBookingSchema = z.object({
  days: z
    .number({ error: "bookings.invalidExtendDays" })
    .int({ error: "bookings.invalidExtendDays" })
    .positive({ error: "bookings.invalidExtendDays" }),
});

/** A rating is required; review text is optional but normalized and bounded. */
export const bookingReviewSchema = z.object({
  rating: z
    .number({ error: "bookings.ratingRequired" })
    .int({ error: "bookings.ratingRequired" })
    .min(1, { error: "bookings.ratingRequired" })
    .max(5, { error: "bookings.ratingRequired" }),
  review: z
    .string({ error: "bookings.invalidReview" })
    .trim()
    .max(MAX_REVIEW_LENGTH, { error: "bookings.reviewTooLong" }),
});

/** Edit requests use the same normalized booking details as initial checkout. */
export const bookingEditSchema = bookingDetailsSchema;

export type ExtendBookingFormValues = z.infer<typeof extendBookingSchema>;
export type BookingReviewFormValues = z.infer<typeof bookingReviewSchema>;
export type BookingEditFormValues = z.infer<typeof bookingEditSchema>;

export const MY_BOOKINGS_LIMITS = {
  maxReviewLength: MAX_REVIEW_LENGTH,
} as const;
