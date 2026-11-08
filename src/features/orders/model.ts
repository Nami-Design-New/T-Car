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

/** Legacy detail status, kept until the booking details screen moves in O3. */
export type BookingStatus =
  "current" | "upcoming" | "late" | "completed" | "cancelled";

/** Legacy booking shape used by the mock details read until O3. */
export interface UserBooking {
  id: string;
  carName: string;
  carBrand: string;
  carImage: string;
  showroom: string;
  showroomLogo?: string;
  year: number;
  rating: number;
  status: BookingStatus;
  statusLabel: string;
  dateLabel: string;
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

export interface BookingDetailsView {
  id: string;
  reference: string;
  carName: string;
  carBrand: string;
  carImage: string;
  showroom: string;
  status: BookingStatus;
  statusLabel: string;
  pricePerDay: number;
  originalPrice?: number;
  pickupDateTime: string;
  dropoffDateTime: string;
  pickupLocation: string;
  dropoffLocation: string;
  warrantyNote: string;
  pointsUsed: number;
  days: number;
  subtotal: number;
  vatRate: number;
  vat: number;
  total: number;
  /** Share of the total kept as a fee when the customer cancels. */
  cancellationPercent: number;
  bannerTimestamp?: string;
}

/** What the edit request form submits; the same shape the booking form uses. */
export type BookingEditRequest = BookingDetails;

export interface BookingReviewInput {
  /** 1 to 5 */
  showroomRating: number;
  driverRating: number;
}

const ACTIVE_STATUSES: readonly BookingStatus[] = [
  "current",
  "upcoming",
  "late",
];

/** Not finished yet: the customer can still edit, extend, or cancel it. */
export const isActiveBooking = (status: BookingStatus) =>
  ACTIVE_STATUSES.includes(status);

/** The car is out with the customer, so the return countdown applies. */
export const isRentalRunning = (status: BookingStatus) =>
  status === "current" || status === "late";
