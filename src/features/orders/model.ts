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

export type BookingStatus =
  "current" | "upcoming" | "late" | "completed" | "cancelled";

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
