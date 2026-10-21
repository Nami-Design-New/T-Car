import { z } from "zod";
import type { LocationData } from "@/shared/lib/location";

export const TIME_SLOTS = [
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
] as const;

const MAX_NOTES_LENGTH = 500;
const MAX_ADDRESS_LENGTH = 200;

const requiredDate = (message: string) =>
  z
    .date({ error: message })
    .nullable()
    .refine((value): value is Date => value !== null, { error: message })
    .transform((value) => value as Date);

const optionalText = (message: string, max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: message })
    .optional()
    .transform((value) => (value === "" ? undefined : value));

const locationSchema = z
  .object({
    lat: z
      .number({ error: "booking.invalidLocation" })
      .finite({ error: "booking.invalidLocation" }),
    lng: z
      .number({ error: "booking.invalidLocation" })
      .finite({ error: "booking.invalidLocation" }),
    address: z
      .string({ error: "booking.invalidLocation" })
      .trim()
      .max(MAX_ADDRESS_LENGTH, {
        error: "booking.addressTooLong",
      }),
  })
  .nullable()
  .optional();

export const bookingDetailsSchema = z
  .object({
    startDate: requiredDate("booking.startDateRequired"),
    endDate: requiredDate("booking.endDateRequired"),
    time: z.enum(TIME_SLOTS, { error: "booking.timeRequired" }),
    days: z
      .number({ error: "booking.invalidDays" })
      .int({ error: "booking.invalidDays" })
      .positive({ error: "booking.invalidDays" }),
    pricePerDay: z
      .number({ error: "booking.invalidPrice" })
      .finite({ error: "booking.invalidPrice" })
      .nonnegative({ error: "booking.invalidPrice" }),
    subtotal: z
      .number({ error: "booking.invalidPrice" })
      .finite({ error: "booking.invalidPrice" })
      .nonnegative({ error: "booking.invalidPrice" }),
    vat: z
      .number({ error: "booking.invalidPrice" })
      .finite({ error: "booking.invalidPrice" })
      .nonnegative({ error: "booking.invalidPrice" }),
    total: z
      .number({ error: "booking.invalidPrice" })
      .finite({ error: "booking.invalidPrice" })
      .nonnegative({ error: "booking.invalidPrice" }),
    notes: z
      .string({ error: "booking.invalidNotes" })
      .trim()
      .max(MAX_NOTES_LENGTH, {
        error: "booking.notesTooLong",
      }),
    pickupAddress: optionalText("booking.addressTooLong", MAX_ADDRESS_LENGTH),
    dropoffAddress: optionalText("booking.addressTooLong", MAX_ADDRESS_LENGTH),
    pickupLocation: locationSchema,
    dropoffLocation: locationSchema,
  })
  .superRefine((details, context) => {
    if (
      !(details.startDate instanceof Date) ||
      !(details.endDate instanceof Date)
    )
      return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (details.startDate < today) {
      context.addIssue({
        code: "custom",
        path: ["startDate"],
        message: "booking.startInPast",
      });
    }

    if (details.endDate <= details.startDate) {
      context.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "booking.invalidDates",
      });
    }

    const expectedDays = Math.max(
      1,
      Math.round(
        (details.endDate.getTime() - details.startDate.getTime()) / 86400000,
      ),
    );
    if (details.days !== expectedDays) {
      context.addIssue({
        code: "custom",
        path: ["days"],
        message: "booking.invalidDays",
      });
    }
  });

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

export type BookingDetailsFormValues = z.input<typeof bookingDetailsSchema>;
export type BookingDetailsValues = z.output<typeof bookingDetailsSchema>;
export type CreateBookingValues = z.output<typeof createBookingSchema>;
export type BookingTermsValues = z.infer<typeof bookingTermsSchema>;
export type BookingLocation = z.output<typeof locationSchema>;

export const BOOKING_LIMITS = {
  maxNotesLength: MAX_NOTES_LENGTH,
  maxAddressLength: MAX_ADDRESS_LENGTH,
} as const;

export type { LocationData };
