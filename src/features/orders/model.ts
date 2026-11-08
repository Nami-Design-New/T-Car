import type { LocationData } from "@/shared/lib/location";

export type PaymentMethod = "wallet" | "visa" | "tabby" | "tamara";

/** What the daily booking form produces: dates, time, places, and the price. */
export interface BookingDetails {
  startDate: Date;
  endDate: Date;
  time: string;
  days: number;
  pricePerDay: number;
  subtotal: number;
  vat: number;
  total: number;
  notes: string;
  pickupAddress?: string;
  dropoffAddress?: string;
  pickupLocation?: LocationData | null;
  dropoffLocation?: LocationData | null;
}

export interface CreateBookingRequest {
  carId: string;
  details: BookingDetails;
  paymentMethod: PaymentMethod;
  termsAccepted: boolean;
}

export type OrderStatus =
  | "start"
  | "new"
  | "accepted"
  | "rejected"
  | "open"
  | "coming"
  | "current"
  | "late"
  | "complete"
  | "cancelled"
  | "suspended";

export interface OrderListItem {
  id: string;
  carName: string;
  carYear: number;
  carImage: string | null;
  date: string;
  status: OrderStatus;
  lateHours: number | null;
  companyName: string;
  companyLogo: string | null;
  companyRate: number;
  isRated: boolean;
  myRating: {
    companyRate: number | null;
    driverRate: number | null;
  };
}

export type BookingType =
  | "daily"
  | "monthly"
  | "station"
  | "airport"
  | "international";

export type OrderDeliveryType =
  | "to_location"
  | "from_branch"
  | "from_airport"
  | "from_station"
  | "from_location";

export interface OrderLocation {
  latitude: number | null;
  longitude: number | null;
  address: string | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  car: {
    id: string;
    imageUrl: string | null;
    year: number;
    companyName: string;
    companyLogo: string | null;
    lowerPrice: number;
    maxPrice: number;
    rate: number;
    note: string | null;
    brand: { id: string; title: string; logo: string | null };
    type: { id: string; title: string; logo: string | null };
    hasOffer: boolean;
    offer: unknown | null;
  };
  status: OrderStatus;
  lateHours: number | null;
  bookingType: BookingType;
  deliveryType: OrderDeliveryType;
  pickupAt: string;
  returnAt: string;
  pickupLocation: OrderLocation;
  deliveryLocation: OrderLocation;
  branch: {
    id: string;
    title: string;
    distanceKm: number | null;
    latitude: number;
    longitude: number;
    placeId: string;
    region: string;
    address: string;
    logo: string | null;
  };
  note: string | null;
  carPrice: number;
  price: number;
  count: number;
  deliveryFee: number;
  serviceFee: number;
  completionFee: number;
  discount: number;
  totalPrice: number;
  taxValue: number;
  finalPrice: number;
  cancellationFee: number;
  refundAmount: number;
  taxRate: number;
  taxRateType: string;
  serviceFeeRate: number;
  serviceFeeRateType: string;
  payExtension: boolean;
  pendingExtensionId: string | null;
  hasModifyRequest: boolean;
  hasDriver?: boolean;
  isRated: boolean;
  myRating: { companyRate: number | null; driverRate: number | null };
  createdAt: string | null;
  /** Backend HTML, sanitized by the server mapper. */
  terms: string;
}

export type OrderStatusTone = "primary" | "warning" | "success" | "error";
export type OrderListTab = "active" | "past";

const PAST_ORDER_STATUSES: readonly OrderStatus[] = [
  "complete",
  "cancelled",
  "rejected",
];

/** Mirrors E6: past is complete/cancelled/rejected; all listed other statuses are current. */
export const orderTabForStatus = (status: OrderStatus): OrderListTab =>
  PAST_ORDER_STATUSES.includes(status) ? "past" : "active";

/** UI-only status grouping; the DTO guard rejects values outside OrderStatus. */
export function orderStatusTone(status: OrderStatus): OrderStatusTone {
  if (status === "complete") return "success";
  if (status === "rejected" || status === "cancelled" || status === "late")
    return "error";
  if (status === "new" || status === "coming" || status === "suspended")
    return "warning";
  return "primary";
}

/** What the edit request form submits; the same shape the booking form uses. */
export type BookingEditRequest = BookingDetails;

export interface BookingReviewInput {
  /** 1 to 5 */
  showroomRating: number;
  driverRating: number;
}

/**
 * Booking times come without an offset and are Saudi wall-clock time
 * (Asia/Riyadh, UTC+3, no DST). Reading them with that offset gives the same
 * instant on the server (UTC) and in the browser, so the action rules agree
 * during hydration.
 */
export const BOOKING_TIME_OFFSET = "+03:00";

export const bookingInstant = (value: string): Date =>
  new Date(
    /(?:[zZ]|[+-]\d{2}:\d{2})$/.test(value)
      ? value
      : value + BOOKING_TIME_OFFSET,
  );

const dateAfter = (value: string, now: Date) => bookingInstant(value) > now;
const dateReached = (value: string, now: Date) =>
  bookingInstant(value) <= now;

export const isDraft = (order: Pick<Order, "createdAt">) =>
  order.createdAt === null;

export function canCancel(
  order: Pick<Order, "status" | "pickupAt">,
  now = new Date(),
): boolean {
  return (
    (["new", "accepted", "coming"] as const).some(
      (status) => status === order.status,
    ) && dateAfter(order.pickupAt, now)
  );
}

export function canExtend(
  order: Pick<
    Order,
    | "status"
    | "deliveryType"
    | "pickupAt"
    | "payExtension"
    | "pendingExtensionId"
  >,
  now = new Date(),
): boolean {
  if (order.payExtension || order.pendingExtensionId !== null) return false;
  if (order.status === "current" || order.status === "late") return true;
  return (
    (order.status === "accepted" || order.status === "open") &&
    order.deliveryType === "from_branch" &&
    dateReached(order.pickupAt, now)
  );
}

export function canModify(
  order: Pick<Order, "status" | "pickupAt" | "hasModifyRequest">,
  now = new Date(),
): boolean {
  const blocked: readonly OrderStatus[] = [
    "start",
    "current",
    "late",
    "complete",
    "cancelled",
  ];
  return (
    !blocked.includes(order.status) &&
    dateAfter(order.pickupAt, now) &&
    !order.hasModifyRequest
  );
}

export const canRate = (order: Pick<Order, "status">) =>
  order.status === "complete";
