import { describe, expect, it } from "vitest";
import { notificationDestination } from "./router";

describe("notificationDestination", () => {
  it.each([
    "booking_accepted",
    "order_cancelled",
    "extension_applied",
    "modification_applied",
    "modification_rejected",
    "delivery_driver_received",
    "trip_started",
    "delivery_driver_delivered",
    "pickup_driver_received",
    "pickup_driver_in_way_for_store",
    "pickup_driver_delivered",
    "booking_closed",
    "booking_closed_with_refund",
  ])("opens booking details for %s", (action) => {
    expect(notificationDestination({ action, orderId: "304" }).path).toBe(
      "/account/bookings/304",
    );
  });

  it.each(["extension_payment_required", "modification_payment_required"])(
    "focuses payment for %s",
    (action) => {
      expect(notificationDestination({ action, orderId: "304" }).path).toBe(
        "/account/bookings/304?focus=payment",
      );
    },
  );

  it("routes wallet and refund actions to the wallet", () => {
    expect(
      notificationDestination({ action: "wallet_topup", orderId: null }).path,
    ).toBe("/account/wallet");
    expect(
      notificationDestination({ action: "booking_refund", orderId: null }).path,
    ).toBe("/account/wallet");
  });

  it.each([
    { action: null, orderId: null },
    { action: "booking_accepted", orderId: null },
    { action: "booking_accepted", orderId: "invalid" },
    { action: "unrecognised", orderId: "304" },
  ])("falls back safely for invalid payloads", (payload) => {
    expect(notificationDestination(payload).path).toBe(
      "/account/notifications",
    );
  });
});
