import { describe, expect, it } from "vitest";
import { toValidationError } from "@/shared/lib/validation";
import { bookingReviewSchema, extendBookingSchema } from "./validation";

function fieldErrors(result: {
  success: boolean;
  error?: Parameters<typeof toValidationError>[0];
}) {
  return result.success || !result.error
    ? undefined
    : toValidationError(result.error).fieldErrors;
}

describe("my-bookings validation", () => {
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
});
