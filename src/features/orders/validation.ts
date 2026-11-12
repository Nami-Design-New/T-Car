import { z } from "zod";
import { bookingDetailsSchema } from "@/shared/lib/booking-validation";

export const bookingTermsSchema = z.object({
  termsAccepted: z
    .boolean()
    .refine((value) => value, { error: "booking.termsRequired" }),
});

const positiveId = z
  .string()
  .trim()
  .regex(/^[1-9]\d*$/);

/** E5 input (R14): the wallet, one method, or both; never points (R13). */
export const payOrderSchema = z
  .object({
    orderId: positiveId,
    useWallet: z.boolean(),
    paymentMethodId: positiveId.nullable(),
  })
  .refine((value) => value.useWallet || value.paymentMethodId !== null, {
    error: "booking.paymentMethodRequired",
    path: ["paymentMethodId"],
  });

export const createDraftSchema = z
  .object({
    carId: z
      .string()
      .trim()
      .regex(/^[1-9]\d*$/, { error: "booking.carRequired" }),
    branchId: z
      .string()
      .trim()
      .regex(/^[1-9]\d*$/, { error: "booking.invalidLocation" }),
    bookingType: z.enum([
      "daily",
      "monthly",
      "airport",
      "station",
      "international",
    ]),
    deliveryType: z.enum(["to_location", "from_branch"]).optional(),
    details: bookingDetailsSchema,
    services: z
      .array(
        z.object({
          id: z
            .string()
            .trim()
            .regex(/^[1-9]\d*$/, { error: "booking.invalidLocation" }),
          type: z.enum([
            "car_service",
            "driver_service",
            "company_service",
            "child_seat_service",
            "airport_fast_delivery",
          ]),
        }),
      )
      .default([]),
    countryId: z
      .string()
      .trim()
      .regex(/^[1-9]\d*$/, { error: "booking.invalidLocation" })
      .optional(),
    airportId: z
      .string()
      .trim()
      .regex(/^[1-9]\d*$/, { error: "booking.invalidLocation" })
      .optional(),
    stationId: z
      .string()
      .trim()
      .regex(/^[1-9]\d*$/, { error: "booking.invalidLocation" })
      .optional(),
    returnAtPickupPoint: z.boolean().optional(),
    returnLocation: z
      .object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
        region: z.string().trim().min(1).max(255),
        address: z.string().trim().min(1).max(500),
      })
      .optional(),
  })
  .superRefine((value, context) => {
    const invalid = (path: string) =>
      context.addIssue({
        path: [path],
        code: "custom",
        message: "booking.invalidLocation",
      });
    const { bookingType: type } = value;
    // create-booking doc: delivery_type only for daily, monthly, international.
    if (
      (type === "daily" || type === "monthly" || type === "international") &&
      !value.deliveryType
    )
      invalid("deliveryType");
    if (type === "airport") {
      if (!value.airportId) invalid("airportId");
      if (value.returnAtPickupPoint === undefined)
        invalid("returnAtPickupPoint");
      // delivery_to_airport=0: the client sends the return location.
      if (value.returnAtPickupPoint === false && !value.returnLocation)
        invalid("returnLocation");
    }
    if (type === "station") {
      if (!value.stationId) invalid("stationId");
      if (value.returnAtPickupPoint === undefined)
        invalid("returnAtPickupPoint");
      // Known issue: delivery_* is sent for every station booking.
      if (!value.returnLocation) invalid("returnLocation");
    }
  });

const apiDate = z
  .string({ error: "booking.invalidDates" })
  .regex(/^\d{4}-\d{2}-\d{2}$/, { error: "booking.invalidDates" })
  .refine(
    (value) => {
      const [year, month, day] = value.split("-").map(Number);
      const date = new Date(Date.UTC(year, month - 1, day));
      return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
      );
    },
    { error: "booking.invalidDates" },
  );

export const availabilitySchema = z
  .object({
    carId: z.string().regex(/^[1-9]\d*$/, { error: "booking.carRequired" }),
    branchId: z
      .string()
      .regex(/^[1-9]\d*$/, { error: "booking.invalidLocation" }),
    type: z.enum(["daily", "monthly", "airport", "station", "international"], {
      error: "booking.invalidType",
    }),
    fromDay: apiDate,
    toDay: apiDate.optional(),
    // The API owns the monthly duration limit. Keep client validation to shape only.
    count: z.number().int().positive().optional(),
    // Daily, monthly, and international only; airport and station send none.
    deliveryType: z.enum(["to_location", "from_branch"]).optional(),
  })
  .superRefine((value, context) => {
    if (
      value.type !== "airport" &&
      value.type !== "station" &&
      !value.deliveryType
    ) {
      context.addIssue({
        path: ["deliveryType"],
        code: "custom",
        message: "booking.invalidLocation",
      });
    }
    if (
      value.type !== "monthly" &&
      (!value.toDay || value.toDay <= value.fromDay)
    ) {
      context.addIssue({
        path: ["toDay"],
        code: "custom",
        message: "booking.invalidDates",
      });
    }
    if (value.type === "monthly" && value.count === undefined) {
      context.addIssue({
        path: ["count"],
        code: "custom",
        message: "booking.invalidMonths",
      });
    }
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

export const modificationRequestSchema = z
  .object({
    type: z.enum(["days_count", "pickup_time"]),
    count: z.number().int().positive().optional(),
    pickupTime: z
      .string()
      .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
      .optional(),
    store: z.boolean(),
  })
  .superRefine((value, context) => {
    if (value.type === "days_count" && value.count === undefined)
      context.addIssue({
        path: ["count"],
        code: "custom",
        message: "booking.invalidDays",
      });
    if (value.type === "pickup_time" && !value.pickupTime)
      context.addIssue({
        path: ["pickupTime"],
        code: "custom",
        message: "booking.timeRequired",
      });
  });

export type PayOrderValues = z.output<typeof payOrderSchema>;
export type CreateDraftValues = z.output<typeof createDraftSchema>;
export type BookingTermsValues = z.infer<typeof bookingTermsSchema>;
export type ExtendBookingFormValues = z.infer<typeof extendBookingSchema>;
export type BookingReviewFormValues = z.infer<typeof bookingReviewSchema>;
export type BookingEditFormValues = z.infer<typeof bookingEditSchema>;
export type AvailabilityValues = z.infer<typeof availabilitySchema>;
export type ModificationRequestValues = z.infer<
  typeof modificationRequestSchema
>;
