import { describe, expect, it } from "vitest";
import { toValidationError } from "@/shared/lib/validation";
import {
  bookingReviewSchema,
  createDraftSchema,
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
      expect(
        payOrderSchema.safeParse({ orderId: "226", ...choice }).success,
      ).toBe(true);
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

describe("createDraftSchema airport and station rules", () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + 1);
  const end = new Date(start);
  end.setDate(end.getDate() + 2);
  const base = {
    carId: "1",
    branchId: "3",
    details: {
      startDate: start,
      endDate: end,
      time: "09",
      days: 2,
      pricePerDay: 90,
      subtotal: 180,
      vat: 0,
      total: 180,
      notes: "",
      pickupLocation: null,
      dropoffLocation: null,
    },
  };
  const returnLocation = {
    lat: 30.04,
    lng: 31.23,
    region: "Cairo",
    address: "Branch street",
  };
  const errors = (input: unknown) => {
    const result = createDraftSchema.safeParse(input);
    return result.success
      ? undefined
      : toValidationError(result.error).fieldErrors;
  };

  it("needs no delivery type for airport and station, but does for daily", () => {
    expect(
      errors({
        ...base,
        bookingType: "airport",
        airportId: "2",
        returnAtPickupPoint: true,
      }),
    ).toBeUndefined();
    expect(errors({ ...base, bookingType: "daily" })).toHaveProperty(
      "deliveryType",
    );
  });

  it("airport needs the airport, and a return location when not returned there", () => {
    expect(
      errors({ ...base, bookingType: "airport", returnAtPickupPoint: true }),
    ).toHaveProperty("airportId");
    expect(
      errors({
        ...base,
        bookingType: "airport",
        airportId: "2",
        returnAtPickupPoint: false,
      }),
    ).toHaveProperty("returnLocation");
    expect(
      errors({
        ...base,
        bookingType: "airport",
        airportId: "2",
        returnAtPickupPoint: false,
        returnLocation,
      }),
    ).toBeUndefined();
  });

  it("station always needs the return location", () => {
    expect(
      errors({
        ...base,
        bookingType: "station",
        stationId: "5",
        returnAtPickupPoint: true,
      }),
    ).toHaveProperty("returnLocation");
  });
});
