import { describe, expect, it } from "vitest";
import { toValidationError } from "@/shared/lib/validation";
import {
  bookingReviewSchema,
  createBookingSchema,
  extendBookingSchema,
} from "./validation";

function tomorrow() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 1);
  return date;
}

function validDetails() {
  const startDate = tomorrow();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 2);
  return {
    startDate,
    endDate,
    time: "09",
    days: 2,
    pricePerDay: 500,
    subtotal: 1000,
    vat: 150,
    total: 1150,
    notes: " Need a child seat ",
    pickupAddress: " Riyadh branch ",
    dropoffAddress: " ",
    pickupLocation: null,
    dropoffLocation: null,
  };
}

function fieldErrors(result: {
  success: boolean;
  error?: Parameters<typeof toValidationError>[0];
}) {
  return result.success || !result.error
    ? undefined
    : toValidationError(result.error).fieldErrors;
}

describe("orders validation", () => {
  it("accepts the two ratings and a whole-number extension", () => {
    expect(
      bookingReviewSchema.parse({ showroomRating: 4, driverRating: 5 }),
    ).toEqual({
      showroomRating: 4,
      driverRating: 5,
    });
    expect(extendBookingSchema.parse({ days: 6 })).toEqual({ days: 6 });
  });

  it("requires both ratings and rejects invalid extension days", () => {
    expect(
      fieldErrors(
        bookingReviewSchema.safeParse({ showroomRating: 0, driverRating: 0 }),
      ),
    ).toEqual({
      showroomRating: "bookings.ratingRequired",
      driverRating: "bookings.ratingRequired",
    });
    expect(fieldErrors(extendBookingSchema.safeParse({ days: 1.5 }))).toEqual({
      days: "bookings.invalidExtendDays",
    });
  });

  it("rejects a rating outside the allowed range", () => {
    expect(
      fieldErrors(
        bookingReviewSchema.safeParse({ showroomRating: 5, driverRating: 6 }),
      ),
    ).toEqual({
      driverRating: "bookings.ratingRequired",
    });
  });

  it("requires accepted terms and a supported payment method", () => {
    const details = validDetails();
    const result = createBookingSchema.safeParse({
      carId: "car-1",
      details,
      paymentMethod: "cash",
      termsAccepted: false,
    });

    expect(result.success).toBe(false);
    expect(
      result.success ? undefined : toValidationError(result.error).fieldErrors,
    ).toMatchObject({
      paymentMethod: expect.any(String),
      termsAccepted: "booking.termsRequired",
    });
  });
});
