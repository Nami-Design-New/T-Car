import type { AppNotification } from "./model";

export type NotificationPayload = Pick<AppNotification, "action" | "orderId">;

const BOOKING_ACTIONS = new Set([
  "booking_accepted",
  "order_cancelled",
  "extension_payment_required",
  "extension_applied",
  "modification_payment_required",
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
]);

const PAYMENT_ACTIONS = new Set([
  "extension_payment_required",
  "modification_payment_required",
]);

export interface NotificationDestination {
  path: string;
  requiresAuth: boolean;
}

/** Never trusts an FCM/data payload: unknown or incomplete data stays safe. */
export function notificationDestination({
  action,
  orderId,
}: NotificationPayload): NotificationDestination {
  const normalized = action?.trim().toLowerCase();
  const validOrderId = orderId !== null && /^\d+$/.test(orderId);

  if (normalized && BOOKING_ACTIONS.has(normalized) && validOrderId) {
    const focus = PAYMENT_ACTIONS.has(normalized) ? "?focus=payment" : "";
    return { path: `/account/bookings/${orderId}${focus}`, requiresAuth: true };
  }
  if (
    normalized &&
    (normalized.includes("wallet") || normalized.includes("refund"))
  ) {
    return { path: "/account/wallet", requiresAuth: true };
  }
  return { path: "/account/notifications", requiresAuth: true };
}
