import { describe, expect, it } from "vitest";
import {
  bookingTabFor,
  bookingsListPath,
  parseBookingTab,
  toEditRequest,
} from "./model";
import {
  orderStatusTone,
  orderTabForStatus,
  type Order,
} from "@/features/orders";

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
    expect(bookingTabFor("coming")).toBe("active");
    expect(bookingTabFor("late")).toBe("active");
    expect(bookingTabFor("complete")).toBe("past");
    expect(bookingTabFor("cancelled")).toBe("past");
  });
});

describe("live order status groups", () => {
  it("matches the E6 current and past groups", () => {
    expect(orderTabForStatus("coming")).toBe("active");
    expect(orderTabForStatus("late")).toBe("active");
    expect(orderTabForStatus("complete")).toBe("past");
    expect(orderTabForStatus("cancelled")).toBe("past");
    expect(orderTabForStatus("rejected")).toBe("past");
  });

  it("groups statuses into badge tones", () => {
    expect(orderStatusTone("current")).toBe("primary");
    expect(orderStatusTone("coming")).toBe("warning");
    expect(orderStatusTone("complete")).toBe("success");
    expect(orderStatusTone("late")).toBe("error");
  });
});

describe("booking edit request", () => {
  it("derives the editable duration from the booking date range", () => {
    const booking = {
      pickupAt: "2026-08-13T16:30:00",
      returnAt: "2026-08-24T16:30:00",
      deliveryType: "from_location",
      branch: { title: "Branch", address: "Address" },
      pickupLocation: { address: "Pickup" },
      deliveryLocation: { address: "Return" },
      note: null,
      carPrice: 500,
      price: 5500,
      taxValue: 550,
      finalPrice: 6050,
    } as Order;

    expect(toEditRequest(booking).days).toBe(11);
  });
});
