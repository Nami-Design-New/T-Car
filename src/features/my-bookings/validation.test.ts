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
  it("normalizes optional review text and accepts a whole-number extension", () => {
    expect(
      bookingReviewSchema.parse({ rating: 4, review: "  Helpful showroom  " }),
    ).toEqual({
      rating: 4,
      review: "Helpful showroom",
    });
    expect(extendBookingSchema.parse({ days: 6 })).toEqual({ days: 6 });
  });

  it("requires a rating and rejects invalid extension days", () => {
    expect(
      fieldErrors(bookingReviewSchema.safeParse({ rating: 0, review: "" })),
    ).toEqual({
      rating: "bookings.ratingRequired",
    });
    expect(fieldErrors(extendBookingSchema.safeParse({ days: 1.5 }))).toEqual({
      days: "bookings.invalidExtendDays",
    });
  });

  it("bounds review text", () => {
    expect(
      fieldErrors(
        bookingReviewSchema.safeParse({ rating: 5, review: "x".repeat(1001) }),
      ),
    ).toEqual({
      review: "bookings.reviewTooLong",
    });
  });
});
