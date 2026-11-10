import { describe, expect, it } from "vitest";
import { toValidationError } from "@/shared/lib/validation";
import {
  bookingReviewSchema,
  extendBookingSchema,
  payOrderSchema,
} from "./validation";

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

  it("accepts the wallet alone, a method alone, or both (R14)", () => {
    for (const choice of [
      { useWallet: true, paymentMethodId: null },
      { useWallet: false, paymentMethodId: "6" },
      { useWallet: true, paymentMethodId: "6" },
    ]) {
      expect(payOrderSchema.safeParse({ orderId: "226", ...choice }).success).toBe(
        true,
      );
    }
  });

  it("requires the wallet or a method, and numeric ids", () => {
    const result = payOrderSchema.safeParse({
      orderId: "226",
      useWallet: false,
      paymentMethodId: null,
    });
    expect(
      result.success ? undefined : toValidationError(result.error).fieldErrors,
    ).toEqual({ paymentMethodId: "booking.paymentMethodRequired" });
    expect(
      payOrderSchema.safeParse({
        orderId: "abc",
        useWallet: true,
        paymentMethodId: null,
      }).success,
    ).toBe(false);
  });
});
