import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/shared/lib/errors";

const { auth, createBooking } = vi.hoisted(() => ({
  auth: vi.fn(),
  createBooking: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth }));
vi.mock("@/services/bookings.api", () => ({ bookingsApi: { createBooking } }));
vi.mock("@/shared/lib/report", () => ({ reportError: vi.fn() }));

import { createBookingAction } from "./actions";

function validRequest() {
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() + 1);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);
  return {
    carId: "car-1",
    details: {
      startDate,
      endDate,
      time: "9:00 AM" as const,
      days: 1,
      pricePerDay: 500,
      subtotal: 500,
      vat: 75,
      total: 575,
      notes: " Need help ",
      pickupAddress: " Riyadh ",
      dropoffAddress: "",
      pickupLocation: null,
      dropoffLocation: null,
    },
    paymentMethod: "wallet" as const,
    termsAccepted: true,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ user: { id: "user-1" } });
  createBooking.mockResolvedValue(undefined);
});

describe("createBookingAction", () => {
  it("rejects malformed input before calling the service", async () => {
    await expect(
      createBookingAction({ ...validRequest(), termsAccepted: false }),
    ).resolves.toEqual({
      ok: false,
      error: {
        kind: "validation",
        code: "booking.termsRequired",
        fieldErrors: { termsAccepted: "booking.termsRequired" },
      },
    });
    expect(createBooking).not.toHaveBeenCalled();
  });

  it("requires a session before calling the service", async () => {
    auth.mockResolvedValue(null);

    await expect(createBookingAction(validRequest())).resolves.toEqual({
      ok: false,
      error: { kind: "unauthorized" },
    });
    expect(createBooking).not.toHaveBeenCalled();
  });

  it("passes the normalized request to the service", async () => {
    await expect(createBookingAction(validRequest())).resolves.toEqual({
      ok: true,
      data: undefined,
    });
    expect(createBooking).toHaveBeenCalledWith(
      expect.objectContaining({
        carId: "car-1",
        paymentMethod: "wallet",
        termsAccepted: true,
        details: expect.objectContaining({
          notes: "Need help",
          pickupAddress: "Riyadh",
          dropoffAddress: undefined,
        }),
      }),
    );
  });

  it("preserves service failures as an ActionResult", async () => {
    createBooking.mockRejectedValue(
      new AppError("conflict", "booking.carUnavailable"),
    );

    await expect(createBookingAction(validRequest())).resolves.toEqual({
      ok: false,
      error: { kind: "conflict", code: "booking.carUnavailable" },
    });
  });
});
