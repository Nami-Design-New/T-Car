import { describe, expect, it } from "vitest";
import { toValidationError } from "@/shared/lib/validation";
import { bookingDetailsSchema, createBookingSchema } from "./validation";

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
    time: "9:00 AM",
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

describe("booking validation", () => {
  it("normalizes text and accepts a valid future booking", () => {
    expect(bookingDetailsSchema.parse(validDetails())).toMatchObject({
      notes: "Need a child seat",
      pickupAddress: "Riyadh branch",
      dropoffAddress: undefined,
      days: 2,
    });
  });

  it("rejects past, unordered, and inconsistent dates", () => {
    const details = validDetails();
    const result = bookingDetailsSchema.safeParse({
      ...details,
      startDate: new Date(0),
      endDate: new Date(0),
      days: 2,
    });

    expect(result.success).toBe(false);
    expect(
      result.success ? undefined : toValidationError(result.error).fieldErrors,
    ).toEqual({
      startDate: "booking.startInPast",
      endDate: "booking.invalidDates",
      days: "booking.invalidDays",
    });
  });

  it("rejects unsupported time and overlong notes", () => {
    const result = bookingDetailsSchema.safeParse({
      ...validDetails(),
      time: "7:00 AM",
      notes: "x".repeat(501),
    });

    expect(result.success).toBe(false);
    expect(
      result.success ? undefined : toValidationError(result.error).fieldErrors,
    ).toEqual({
      time: "booking.timeRequired",
      notes: "booking.notesTooLong",
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
