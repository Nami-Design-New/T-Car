import { describe, expect, it } from "vitest";
import {
  bookingTabFor,
  bookingsListPath,
  parseBookingTab,
  toEditRequest,
} from "./model";
import type { BookingDetailsView } from "./model";

describe("bookings list URL", () => {
  it("reads ?status=, defaulting to the active list", () => {
    expect(parseBookingTab("past")).toBe("past");
    expect(parseBookingTab("active")).toBe("active");
    expect(parseBookingTab(undefined)).toBe("active");
    expect(parseBookingTab(["past"])).toBe("active");
    expect(parseBookingTab("bogus")).toBe("active");
  });

  it("builds the list path, with no parameter for the default", () => {
    expect(bookingsListPath("active")).toBe("/account/bookings");
    expect(bookingsListPath("past")).toBe("/account/bookings?status=past");
  });

  it("puts running and upcoming bookings in the active list, finished ones in past", () => {
    expect(bookingTabFor("current")).toBe("active");
    expect(bookingTabFor("upcoming")).toBe("active");
    expect(bookingTabFor("late")).toBe("active");
    expect(bookingTabFor("completed")).toBe("past");
    expect(bookingTabFor("cancelled")).toBe("past");
  });
});

describe("booking edit request", () => {
  it("derives the editable duration from the booking date range", () => {
    const booking = {
      pickupDateTime: "2026-08-13T16:30:00",
      dropoffDateTime: "2026-08-24T16:30:00",
    } as BookingDetailsView;

    expect(toEditRequest(booking).days).toBe(11);
  });
});
