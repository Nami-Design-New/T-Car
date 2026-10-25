import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/shared/lib/errors";

const { auth, extendBooking, requestBookingEdit, submitReview } = vi.hoisted(
  () => ({
    auth: vi.fn(),
    extendBooking: vi.fn(),
    requestBookingEdit: vi.fn(),
    submitReview: vi.fn(),
  }),
);

vi.mock("@/auth", () => ({ auth }));
vi.mock("@/services/bookings.api", () => ({
  bookingsApi: { extendBooking, requestBookingEdit, submitReview },
}));
vi.mock("@/shared/lib/report", () => ({ reportError: vi.fn() }));

import {
  extendBookingAction,
  requestBookingEditAction,
  submitBookingReviewAction,
} from "./actions";

function validEdit() {
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() + 1);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);
  return {
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
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ user: { id: "user-1" } });
  extendBooking.mockResolvedValue(undefined);
  requestBookingEdit.mockResolvedValue(undefined);
  submitReview.mockResolvedValue(undefined);
});

describe("booking action validation", () => {
  it("rejects malformed extension input before the service", async () => {
    await expect(extendBookingAction("booking-1", 1.5)).resolves.toEqual({
      ok: false,
      error: {
        kind: "validation",
        code: "bookings.invalidExtendDays",
        fieldErrors: { days: "bookings.invalidExtendDays" },
      },
    });
    expect(extendBooking).not.toHaveBeenCalled();
  });

  it("forwards both review ratings to the service", async () => {
    await expect(
      submitBookingReviewAction("booking-1", {
        showroomRating: 4,
        driverRating: 5,
      }),
    ).resolves.toEqual({
      ok: true,
      data: undefined,
    });
    expect(submitReview).toHaveBeenCalledWith("booking-1", {
      showroomRating: 4,
      driverRating: 5,
    });
  });

  it("rejects malformed edit input before the service", async () => {
    await expect(
      requestBookingEditAction("booking-1", { ...validEdit(), days: 2 }),
    ).resolves.toEqual({
      ok: false,
      error: {
        kind: "validation",
        code: "booking.invalidDays",
        fieldErrors: { days: "booking.invalidDays" },
      },
    });
    expect(requestBookingEdit).not.toHaveBeenCalled();
  });

  it("preserves service failures as ActionResults", async () => {
    extendBooking.mockRejectedValue(
      new AppError("conflict", "bookings.extendLimit"),
    );

    await expect(extendBookingAction("booking-1", 10)).resolves.toEqual({
      ok: false,
      error: { kind: "conflict", code: "bookings.extendLimit" },
    });
  });
});
