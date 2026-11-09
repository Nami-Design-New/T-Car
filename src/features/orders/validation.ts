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

const apiDate = z
  .string({ error: "booking.invalidDates" })
  .regex(/^\d{4}-\d{2}-\d{2}$/, { error: "booking.invalidDates" })
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }, { error: "booking.invalidDates" });

export const availabilitySchema = z
  .object({
    carId: z.string().regex(/^[1-9]\d*$/, { error: "booking.carRequired" }),
    branchId: z.string().regex(/^[1-9]\d*$/, { error: "booking.invalidLocation" }),
    type: z.literal("daily"),
    fromDay: apiDate,
    toDay: apiDate,
    deliveryType: z.enum(["to_location", "from_branch"]),
  })
  .refine((value) => value.toDay > value.fromDay, {
    path: ["toDay"],
    error: "booking.invalidDates",
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
export type AvailabilityValues = z.infer<typeof availabilitySchema>;
