import { describe, expect, it } from "vitest";
import { isBookingTypeEnabled, type BookingTypeAvailability } from "./model";

describe("isBookingTypeEnabled", () => {
  const availability: BookingTypeAvailability = {
    daily: false,
    monthly: true,
    station: true,
    airport: false,
    international: true,
  };

  it("rejects a known booking type disabled by settings", () => {
    expect(isBookingTypeEnabled("daily", availability)).toBe(false);
  });

  it("allows enabled, missing, and unknown booking types", () => {
    expect(isBookingTypeEnabled("monthly", availability)).toBe(true);
    expect(isBookingTypeEnabled(undefined, availability)).toBe(true);
    expect(isBookingTypeEnabled("unknown", availability)).toBe(true);
  });
});
