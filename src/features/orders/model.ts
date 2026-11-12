import type { LocationData } from "@/shared/lib/location";
import type { PaymentLinks } from "@/shared/lib/paymentWindow";

/** E3: one active gateway method of the booking's company. */
export interface PaymentMethodOption {
  id: string;
  title: string;
  /** Observed: `tamara`, `tabby`, `apple_pay`, `online`; unknown values are kept (neutral icon). */
  type: string;
}

/** E3 for one draft. Points are not mapped (R13). */
export interface PaymentOptions {
  methods: PaymentMethodOption[];
  walletBalance: number;
}

/**
 * R14: the wallet alone, one gateway method alone, or the wallet plus one
 * method (the wallet pays first, the method pays the rest).
 */
export interface PaymentChoice {
  useWallet: boolean;
  paymentMethodId: string | null;
}

/** E5 input. Never carries points (R13). */
export interface PayOrderRequest extends PaymentChoice {
  orderId: string;
}

/** E12 input. Pays the difference after the admin approves a modification. */
export interface PayModificationRequest extends PaymentChoice {
  orderId: string;
}

/** E10 input. `count` is sent alongside the selected payment choice. */
export interface PayExtensionRequest extends PaymentChoice {
  orderId: string;
  count: number;
}

/** E5 result: paid at once (the wallet covered it) or a gateway tab to open (R10). */
export type PayOrderResult =
  { kind: "paid" } | { kind: "gateway"; payment: PaymentLinks };

/** E10 returns a booking summary when the wallet covers the extension. */
export type PayExtensionResult =
  | { kind: "paid" }
  | { kind: "gateway"; payment: PaymentLinks };

/** Whether a choice is complete: at least the wallet or one method. */
export const isPaymentChoiceComplete = (choice: PaymentChoice): boolean =>
  choice.useWallet || choice.paymentMethodId !== null;

/** R14: the wallet alone cannot pay more than its balance (the backend also answers 422). */
export const walletCoversAlone = (balance: number, amount: number): boolean =>
  balance >= amount;

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
  bookingType?: BookingType;
  months?: number;
}

export type BookingServiceType =
  | "car_service"
  | "driver_service"
  | "company_service"
  | "child_seat_service"
  | "airport_fast_delivery";

export interface BookingServiceSelection {
  id: string;
  type: BookingServiceType;
}

/** Where the car goes back, sent as `delivery_*` (create-booking doc). */
export interface ReturnLocation {
  lat: number;
  lng: number;
  region: string;
  address: string;
}

/** E2 input. Prices are intentionally absent: the API creates the draft. */
export interface CreateDraftRequest {
  carId: string;
  branchId: string;
  bookingType: BookingType;
  /** Daily, monthly, and international only; airport and station send none. */
  deliveryType?: BookingDeliveryTypeRequest;
  details: BookingDetails;
  services?: BookingServiceSelection[];
  countryId?: string;
  airportId?: string;
  stationId?: string;
  /**
   * Airport / station: `delivery_to_airport` / `delivery_to_station`. True
   * when the company has a branch there (R19): the car is returned there.
   */
  returnAtPickupPoint?: boolean;
  /**
   * `delivery_*`: airport with `returnAtPickupPoint` false, and every
   * station booking (backend known issue). The booking branch (R19).
   */
  returnLocation?: ReturnLocation;
}

/** Whether a booking type chooses a delivery type (airport and station do not). */
export const hasDeliveryType = (type: BookingType): boolean =>
  type === "daily" || type === "monthly" || type === "international";

/**
 * E2 input from the car page context (create-booking doc). Null without a
 * branch (R16). Airport / station: no delivery type; `delivery_to_*` follows
 * whether the company has a branch there; the return location is the
 * booking branch (R19).
 */
export function toCreateDraftRequest(
  carId: string,
  context: BookingContext,
  details: BookingDetails,
  services?: BookingServiceSelection[],
): CreateDraftRequest | null {
  const { branch, bookingType } = context;
  if (!branch) return null;
  const request: CreateDraftRequest = {
    carId,
    branchId: branch.id,
    bookingType,
    details,
    services,
  };
  if (hasDeliveryType(bookingType)) request.deliveryType = context.deliveryType;
  if (bookingType === "international") request.countryId = context.countryId;
  if (bookingType === "airport" || bookingType === "station") {
    if (bookingType === "airport") request.airportId = context.airportId;
    else request.stationId = context.stationId;
    request.returnAtPickupPoint = context.pickupPointHasBranch === true;
    if (
      branch.latitude !== undefined &&
      branch.longitude !== undefined &&
      branch.region
    ) {
      request.returnLocation = {
        lat: branch.latitude,
        lng: branch.longitude,
        region: branch.region,
        address: branch.address,
      };
    }
  }
  return request;
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
  "daily" | "monthly" | "station" | "airport" | "international";

export type BookingDeliveryTypeRequest = "to_location" | "from_branch";

export interface BookingContext {
  bookingType: BookingType;
  /** Absent for airport and station (they have no delivery type). */
  deliveryType?: BookingDeliveryTypeRequest;
  location?: {
    region: string;
    latitude: number;
    longitude: number;
  };
  branch?: {
    id: string;
    name: string;
    address: string;
    distanceKm: number;
    latitude?: number;
    longitude?: number;
    region?: string;
    placeId?: string;
    logo?: string;
  };
  airportId?: string;
  stationId?: string;
  countryId?: string;
  /**
   * Airport / station: whether the company has a branch there
   * (`branch_data.has_airport` / `has_station`), R19.
   */
  pickupPointHasBranch?: boolean;
  /**
   * Car details `allowed_distance` (km): to_location pickup and return must be
   * within this range of the branch (create-booking doc); drawn on the map.
   */
  allowedDistanceKm?: number;
}

export interface AvailabilityRequest {
  carId: string;
  branchId: string;
  type: BookingType;
  fromDay: string;
  toDay?: string;
  count?: number;
  /** Daily, monthly, and international only. */
  deliveryType?: BookingDeliveryTypeRequest;
}

export interface Availability {
  slots: string[];
  /** Localized backend envelope message, used when no slots are returned. */
  message: string;
}

export type ModificationType = "days_count" | "pickup_time";

/** E11: preview (`store: false`) or save (`store: true`) a booking change. */
export interface ModificationRequest {
  type: ModificationType;
  count?: number;
  pickupTime?: string;
  store: boolean;
}

/** E11 price result; the server is authoritative for every amount. */
export interface ModificationQuote {
  modificationRequestId: string | null;
  count: number;
  carPrice: number;
  price: number;
  deliveryFee: number;
  serviceFee: number;
  completionFee: number;
  discount: number;
  specialDiscount: number;
  additionalServicesCost: number;
  totalPrice: number;
  taxValue: number;
  finalPrice: number;
  originalFinalPrice: number;
  newFinalPrice: number;
  differenceAmount: number;
}

/** E10 GET quote; all displayed extension amounts come from the backend. */
export interface ExtensionQuote {
  count: number;
  carPrice: number;
  price: number;
  additionalServicesCost: number;
  offerDiscount: number;
  newDeliveryDay: string;
  lateFee: number;
  lateDays: number;
  taxType: string;
  taxValue: number;
  taxAddedValue: number;
  totalAmount: number;
}

export type OrderDeliveryType =
  "to_location" | "from_branch" | "from_airport" | "from_station";

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
  /** The detail DTO accepts any backend value (booking 153 sends from_location). */
  deliveryType: OrderDeliveryType | (string & {});
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
  additionalServicesCost: number;
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
  /** The approved modification is waiting for its price difference to be paid. */
  modifyRequestPendingPayment: boolean;
  /** API value displayed beside the modification-payment action. */
  modifyRequestPaymentAmount: number | null;
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

/** E8 cancel quote returned before a cancellation is confirmed. */
export interface CancelQuote {
  paidAmount: number;
  cancellationFee: number;
  discountPercent: number;
  total: number;
}

/** Product action-menu policy. The backend remains authoritative for every write. */
export const canCancel = (order: Pick<Order, "status">): boolean =>
  order.status === "coming";

export const canExtend = (order: Pick<Order, "status">): boolean =>
  order.status === "current" || order.status === "late";

export const canModify = (order: Pick<Order, "status">): boolean =>
  order.status === "coming";

export const canRate = (order: Pick<Order, "status">) =>
  order.status === "complete";
