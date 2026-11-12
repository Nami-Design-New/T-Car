import "server-only";
import type { ApiPage, ApiPagination } from "@/services/http/envelope";
import { isApiEnvelope } from "@/services/http/envelope";
import { serverHttp } from "@/services/http/server";
import { AppError } from "@/shared/lib/errors";
import { toPage, type Page } from "@/shared/lib/pagination";
import { sanitizeBackendHtml } from "@/shared/lib/sanitizeHtml";
import { isHttpsUrl } from "@/shared/lib/paymentWindow";
import { fail, ok, type Result } from "@/shared/lib/result";
import { bookingsMock } from "./api.mock";
import type {
  Availability,
  AvailabilityRequest,
  CancelQuote,
  BookingType,
  BookingEditRequest,
  ModificationQuote,
  ExtensionQuote,
  ModificationRequest,
  BookingReviewInput,
  CreateDraftRequest,
  Order,
  OrderListItem,
  OrderStatus,
  PaymentMethodOption,
  PaymentOptions,
  PayOrderRequest,
  PayOrderResult,
  PayExtensionRequest,
  PayExtensionResult,
  PayModificationRequest,
} from "./model";

export type OrdersListStatus = "current" | "past";
export const ORDERS_PER_PAGE = 10;

export interface ListOrdersParams {
  status: OrdersListStatus;
  page: number;
  perPage: number;
}

export interface BookingsApi {
  checkAvailability(request: AvailabilityRequest): Promise<Availability>;
  listOrders(params: ListOrdersParams): Promise<Page<OrderListItem>>;
  /** Throws a `not_found` AppError for an unknown id. */
  getOrder(id: string): Promise<Order>;
  /** E8: previews the cancellation refund and fee. */
  getCancelQuote(id: string): Promise<CancelQuote>;
  /** `days` is the new total rental length. */
  extendBooking(id: string, days: number): Promise<void>;
  /** E10 quote for the selected extension-day count. */
  getExtensionQuote(id: string, count: number): Promise<ExtensionQuote>;
  requestBookingEdit(id: string, request: BookingEditRequest): Promise<void>;
  requestModification(
    id: string,
    request: ModificationRequest,
  ): Promise<ModificationQuote>;
  /** E8 confirmation; the optional backend message is shown in the result dialog. */
  cancelBooking(id: string): Promise<string | undefined>;
  submitReview(id: string, input: BookingReviewInput): Promise<void>;
  createDraft(request: CreateDraftRequest): Promise<Order>;
  /** E3: the company's gateway methods and the wallet balance for a draft. */
  getPaymentOptions(orderId: string): Promise<PaymentOptions>;
  /** E5: pays the draft; a 422 comes back as a failed Result (R5). */
  payOrder(request: PayOrderRequest): Promise<Result<PayOrderResult>>;
  /** E12: pays an approved modification's difference. */
  payModification(
    request: PayModificationRequest,
  ): Promise<Result<PayOrderResult>>;
  /** E10: creates and pays an extension. */
  payExtension(
    request: PayExtensionRequest,
  ): Promise<Result<PayExtensionResult>>;
}

export interface AvailabilityDto {
  slots: { time: string }[];
}

interface ModificationQuoteDto {
  modification_request_id: number | null;
  car_price: number;
  price: number;
  count: number;
  deliver_fee: number;
  service_fee: number;
  completion_fee: number;
  discount: number;
  special_discount?: number;
  additional_services_cost: number;
  total_price: number;
  tax_value: number;
  final_price: number;
  original_final_price?: number;
  new_final_price: number;
  difference_amount: number;
}

interface ExtensionQuoteDto {
  count: number;
  car_price: number;
  price: number;
  additional_services_cost: number;
  offer_discount: number;
  new_delivery_day: string;
  late_fee: number;
  late_days: number;
  tax_type: string;
  tax_value: number;
  tax_added_value: number;
  total_amount: number;
}

export interface OrderListItemDto {
  id: number;
  car_image: string | null;
  car_name: string;
  car_year: number;
  date: string;
  status: OrderStatus;
  late_hours: number | null;
  company_name: string;
  company_rate: number;
  company_logo: string | null;
  is_rated: boolean;
  my_rating: {
    company_rate: number | null;
    driver_rate: number | null;
  };
}

interface LookupDto {
  id: number;
  title: string;
  logo: string | null;
}

interface OrderCarDto {
  id: number;
  image_url: string | null;
  year: number;
  company_name: string;
  company_logo: string | null;
  lower_price: number;
  max_price: number;
  rate: number;
  note: string | null;
  brand: LookupDto;
  type: LookupDto;
  has_offer: boolean;
  offer: unknown | null;
}

interface OrderBranchDto {
  id: number;
  title: string;
  distance_km: number | null;
  latitude: string;
  longitude: string;
  place_id: string;
  region: string;
  address: string;
  logo: string | null;
}

/** TEST returns order location coordinates as strings for some types and numbers for airport bookings. */
type OrderCoordinate = string | number | null;

export interface OrderDto {
  id: number;
  order_number: string;
  user_id: number;
  car: OrderCarDto;
  status: OrderStatus;
  late_hours: number | null;
  booking_type: BookingType;
  /** Any string: the guard accepts values beyond the request list (Q5b). */
  delivery_type: string;
  pickup_day: string;
  delivery_day: string;
  pickup_time: string;
  delivery_time: string;
  pickup_location: {
    pickup_lat: OrderCoordinate;
    pickup_long: OrderCoordinate;
    address: string | null;
  };
  delivery_location: {
    delivery_lat: OrderCoordinate;
    delivery_long: OrderCoordinate;
    address: string | null;
  };
  branch: OrderBranchDto;
  note: string | null;
  car_price: number;
  price: number;
  count: number;
  delivery_fee: number;
  service_fee: number;
  completion_fee: number;
  discount: number;
  coupon_code: string | null;
  coupon_discount: number;
  additional_services_cost: number;
  total_price: number;
  tax_value: number;
  final_price: number;
  cancellation_fee: number;
  refund_amount: number;
  tax_rate: number;
  tax_rate_type: string;
  service_fee_rate: number;
  service_fee_rate_type: string;
  pay_extension: boolean;
  pending_extension_id: number | null;
  has_modify_request: boolean;
  modify_request_pending_payment?: boolean;
  modify_request_payment_amount?: number | null;
  has_driver?: boolean;
  is_rated: boolean;
  my_rating: { company_rate: number | null; driver_rate: number | null };
  created_at: string | null;
  terms: string;
}

export interface CancelQuoteDto {
  payed_amount: number;
  can_cancel_fee_amount: number;
  cancel_fee_percentage: number;
  total: number;
}

/**
 * E8 with `is_quote=0` returns the cancelled booking, but not the complete
 * detail payload: the observed response omits `branch`. Keep this distinct
 * from `OrderDto`, which is used by the details and draft endpoints.
 */
interface CancelConfirmationDto {
  id: number;
  order_number: string;
  status: "cancelled";
  cancellation_fee: number;
  refund_amount: number;
}

const ORDER_STATUSES = [
  "start",
  "new",
  "accepted",
  "rejected",
  "open",
  "coming",
  "current",
  "late",
  "complete",
  "cancelled",
  "suspended",
] as const satisfies readonly OrderStatus[];

const BOOKING_TYPES = [
  "daily",
  "monthly",
  "station",
  "airport",
  "international",
] as const satisfies readonly BookingType[];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isCancelQuoteDto = (value: unknown): value is CancelQuoteDto =>
  isRecord(value) &&
  typeof value.payed_amount === "number" &&
  typeof value.can_cancel_fee_amount === "number" &&
  typeof value.cancel_fee_percentage === "number" &&
  typeof value.total === "number";

const isCancelConfirmationDto = (
  value: unknown,
): value is CancelConfirmationDto =>
  isRecord(value) &&
  isId(value.id) &&
  typeof value.order_number === "string" &&
  value.status === "cancelled" &&
  isFiniteNumber(value.cancellation_fee) &&
  isFiniteNumber(value.refund_amount);

export function mapCancelQuoteResponse(response: unknown): CancelQuote {
  const data = isApiEnvelope(response) ? response.data : undefined;
  if (
    !isApiEnvelope(response) ||
    response.code !== 200 ||
    !isCancelQuoteDto(data)
  ) {
    throw new AppError("server");
  }

  return {
    paidAmount: data.payed_amount,
    cancellationFee: data.can_cancel_fee_amount,
    discountPercent: data.cancel_fee_percentage,
    total: data.total,
  };
}

/** Validates E8's successful cancellation response without assuming detail-only fields. */
export function mapCancelConfirmationResponse(response: unknown): void {
  const data = isApiEnvelope(response) ? response.data : undefined;
  if (
    !isApiEnvelope(response) ||
    response.code !== 200 ||
    !isCancelConfirmationDto(data)
  ) {
    throw new AppError("server");
  }
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isNonnegativeInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0;

const isNullableNumber = (value: unknown): value is number | null =>
  value === null || isFiniteNumber(value);

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === "string";

const isId = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 1;

/** A plain decimal such as "24.7136" (no hex, exponent, or spaces). */
const isNumericString = (value: unknown): value is string =>
  typeof value === "string" && /^-?\d+(?:\.\d+)?$/.test(value);

const isOrderCoordinate = (value: unknown): value is OrderCoordinate =>
  value === null || isFiniteNumber(value) || isNumericString(value);

/**
 * E6 sends 'YYYY-MM-DD HH:mm' (§4.2); a 'T' separator and seconds are also
 * accepted. It must be a real date: rendering an invalid one would throw.
 */
const isListDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(?::\d{2})?$/.test(value) &&
  !Number.isNaN(new Date(value.replace(" ", "T")).getTime());

const isOrderStatus = (value: unknown): value is OrderStatus =>
  ORDER_STATUSES.some((status) => status === value);

const isBookingType = (value: unknown): value is BookingType =>
  BOOKING_TYPES.some((type) => type === value);

const isDatePart = (value: unknown): value is string =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(new Date(`${value}T00:00:00`).getTime());

const isTimePart = (value: unknown): value is string =>
  typeof value === "string" &&
  /^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(value);

const isAvailabilityHour = (value: unknown): value is string =>
  typeof value === "string" && /^(?:[01]\d|2[0-3])$/.test(value);

function isAvailabilityDto(value: unknown): value is AvailabilityDto {
  return (
    isRecord(value) &&
    Array.isArray(value.slots) &&
    value.slots.every((slot) => isRecord(slot) && isAvailabilityHour(slot.time))
  );
}

const isDateTime = (value: unknown): value is string =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value) &&
  !Number.isNaN(new Date(value.replace(" ", "T")).getTime());

function isLookup(value: unknown): value is LookupDto {
  return (
    isRecord(value) &&
    isId(value.id) &&
    typeof value.title === "string" &&
    isNullableString(value.logo)
  );
}

function isOrderCar(value: unknown): value is OrderCarDto {
  return (
    isRecord(value) &&
    isId(value.id) &&
    isNullableString(value.image_url) &&
    typeof value.year === "number" &&
    Number.isInteger(value.year) &&
    typeof value.company_name === "string" &&
    isNullableString(value.company_logo) &&
    isFiniteNumber(value.lower_price) &&
    isFiniteNumber(value.max_price) &&
    isFiniteNumber(value.rate) &&
    isNullableString(value.note) &&
    isLookup(value.brand) &&
    isLookup(value.type) &&
    typeof value.has_offer === "boolean" &&
    "offer" in value
  );
}

function isOrderBranch(value: unknown): value is OrderBranchDto {
  return (
    isRecord(value) &&
    isId(value.id) &&
    typeof value.title === "string" &&
    isNullableNumber(value.distance_km) &&
    isNumericString(value.latitude) &&
    isNumericString(value.longitude) &&
    typeof value.place_id === "string" &&
    typeof value.region === "string" &&
    typeof value.address === "string" &&
    isNullableString(value.logo)
  );
}

function isPickupLocation(
  value: unknown,
): value is OrderDto["pickup_location"] {
  return (
    isRecord(value) &&
    isOrderCoordinate(value.pickup_lat) &&
    isOrderCoordinate(value.pickup_long) &&
    isNullableString(value.address)
  );
}

function isDeliveryLocation(
  value: unknown,
): value is OrderDto["delivery_location"] {
  return (
    isRecord(value) &&
    isOrderCoordinate(value.delivery_lat) &&
    isOrderCoordinate(value.delivery_long) &&
    isNullableString(value.address)
  );
}

function isOrderDto(value: unknown): value is OrderDto {
  if (!isRecord(value) || !isRecord(value.my_rating)) return false;
  const numbers = [
    value.car_price,
    value.price,
    value.count,
    value.delivery_fee,
    value.service_fee,
    value.completion_fee,
    value.discount,
    value.coupon_discount,
    value.additional_services_cost,
    value.total_price,
    value.tax_value,
    value.final_price,
    value.cancellation_fee,
    value.refund_amount,
    value.tax_rate,
    value.service_fee_rate,
  ];
  return (
    isId(value.id) &&
    typeof value.order_number === "string" &&
    isId(value.user_id) &&
    isOrderCar(value.car) &&
    isOrderStatus(value.status) &&
    isNullableNumber(value.late_hours) &&
    isBookingType(value.booking_type) &&
    typeof value.delivery_type === "string" &&
    isDatePart(value.pickup_day) &&
    isDatePart(value.delivery_day) &&
    isTimePart(value.pickup_time) &&
    isTimePart(value.delivery_time) &&
    isPickupLocation(value.pickup_location) &&
    isDeliveryLocation(value.delivery_location) &&
    isOrderBranch(value.branch) &&
    isNullableString(value.note) &&
    numbers.every(isFiniteNumber) &&
    isNonnegativeInteger(value.count) &&
    isNullableString(value.coupon_code) &&
    typeof value.tax_rate_type === "string" &&
    typeof value.service_fee_rate_type === "string" &&
    typeof value.pay_extension === "boolean" &&
    (value.pending_extension_id === null || isId(value.pending_extension_id)) &&
    typeof value.has_modify_request === "boolean" &&
    (value.modify_request_pending_payment === undefined ||
      typeof value.modify_request_pending_payment === "boolean") &&
    (value.modify_request_payment_amount === undefined ||
      isNullableNumber(value.modify_request_payment_amount)) &&
    (value.has_driver === undefined || typeof value.has_driver === "boolean") &&
    typeof value.is_rated === "boolean" &&
    isNullableNumber(value.my_rating.company_rate) &&
    isNullableNumber(value.my_rating.driver_rate) &&
    (value.created_at === null || isDateTime(value.created_at)) &&
    typeof value.terms === "string"
  );
}

function isOrderListItemDto(value: unknown): value is OrderListItemDto {
  if (!isRecord(value) || !isRecord(value.my_rating)) return false;
  return (
    typeof value.id === "number" &&
    Number.isSafeInteger(value.id) &&
    value.id >= 1 &&
    isNullableString(value.car_image) &&
    typeof value.car_name === "string" &&
    typeof value.car_year === "number" &&
    Number.isInteger(value.car_year) &&
    typeof value.date === "string" &&
    isListDate(value.date) &&
    isOrderStatus(value.status) &&
    isNullableNumber(value.late_hours) &&
    typeof value.company_name === "string" &&
    isFiniteNumber(value.company_rate) &&
    isNullableString(value.company_logo) &&
    typeof value.is_rated === "boolean" &&
    isNullableNumber(value.my_rating.company_rate) &&
    isNullableNumber(value.my_rating.driver_rate)
  );
}

function isApiPagination(value: unknown): value is ApiPagination {
  if (!isRecord(value)) return false;
  const counts = [
    value.current_page,
    value.last_page,
    value.per_page,
    value.total,
  ];
  return (
    counts.every(
      (count) =>
        typeof count === "number" && Number.isInteger(count) && count >= 0,
    ) &&
    (value.from === null ||
      (typeof value.from === "number" && Number.isInteger(value.from))) &&
    (value.to === null ||
      (typeof value.to === "number" && Number.isInteger(value.to)))
  );
}

export function mapOrdersResponse(value: unknown): Page<OrderListItem> {
  const pagination = isRecord(value) ? value.pagination : undefined;
  if (
    !isApiEnvelope(value) ||
    value.code !== 200 ||
    !Array.isArray(value.data) ||
    !value.data.every(isOrderListItemDto) ||
    !isApiPagination(pagination)
  ) {
    throw new AppError("server");
  }
  return toPage(value.data.map(toOrderListItem), pagination);
}

interface PaymentMethodDto {
  id: number;
  title: string;
  /** Live only; missing from the Bruno example. */
  type?: string;
}

function isPaymentMethodDto(value: unknown): value is PaymentMethodDto {
  return (
    isRecord(value) &&
    isId(value.id) &&
    typeof value.title === "string" &&
    (value.type === undefined || typeof value.type === "string")
  );
}

/** E3 → PaymentOptions. `points` / `points_value` and the Bootstrap `icon` class are not mapped (R13, Q8). */
export function mapPaymentOptionsResponse(value: unknown): PaymentOptions {
  const data = isRecord(value) ? value.data : undefined;
  if (
    !isApiEnvelope(value) ||
    !isRecord(data) ||
    !Array.isArray(data.payment_methods) ||
    !data.payment_methods.every(isPaymentMethodDto) ||
    !isFiniteNumber(data.wallet_balance)
  ) {
    throw new AppError("server");
  }
  return {
    methods: data.payment_methods.map((method): PaymentMethodOption => ({
      id: String(method.id),
      title: method.title,
      type: method.type ?? "",
    })),
    walletBalance: data.wallet_balance,
  };
}

/**
 * E5 → PayOrderResult. `data: null` means the wallet paid everything; three
 * https links mean a gateway tab (R10). Anything else is a `server` error.
 */
export function mapPayResponse(value: unknown): PayOrderResult {
  if (!isApiEnvelope(value)) throw new AppError("server");
  const { data } = value as { data: unknown };
  if (data === null || data === undefined) return { kind: "paid" };
  if (
    isRecord(data) &&
    isHttpsUrl(data.payment_url) &&
    isHttpsUrl(data.success_url) &&
    isHttpsUrl(data.fail_url)
  ) {
    return {
      kind: "gateway",
      payment: {
        paymentUrl: data.payment_url,
        successUrl: data.success_url,
        failUrl: data.fail_url,
      },
    };
  }
  throw new AppError("server");
}

/** E10 is the same gateway shape as E5, but wallet success returns a booking summary. */
export function mapExtensionPayResponse(value: unknown): PayExtensionResult {
  if (!isApiEnvelope(value) || value.code !== 200)
    throw new AppError("server");
  const { data } = value as { data: unknown };
  if (
    isRecord(data) &&
    isHttpsUrl(data.payment_url) &&
    isHttpsUrl(data.success_url) &&
    isHttpsUrl(data.fail_url)
  ) {
    return {
      kind: "gateway",
      payment: {
        paymentUrl: data.payment_url,
        successUrl: data.success_url,
        failUrl: data.fail_url,
      },
    };
  }
  if (
    isRecord(data) &&
    isId(data.id) &&
    typeof data.status === "string" &&
    typeof data.order_number === "string"
  ) {
    return { kind: "paid" };
  }
  throw new AppError("server");
}

export function mapAvailabilityResponse(value: unknown): Availability {
  const data = isRecord(value) ? value.data : undefined;
  if (!isApiEnvelope(value) || value.code !== 200 || !isAvailabilityDto(data)) {
    throw new AppError("server");
  }
  return {
    slots: data.slots.map((slot) => slot.time),
    message: value.message,
  };
}

export function mapModificationQuoteResponse(
  value: unknown,
): ModificationQuote {
  const data = isRecord(value) ? value.data : undefined;
  if (
    !isApiEnvelope(value) ||
    value.code !== 200 ||
    !isRecord(data) ||
    (data.modification_request_id !== null &&
      !isId(data.modification_request_id)) ||
    ![
      data.count,
      data.car_price,
      data.price,
      data.deliver_fee,
      data.service_fee,
      data.completion_fee,
      data.discount,
      data.additional_services_cost,
      data.total_price,
      data.tax_value,
      data.final_price,
      data.new_final_price,
      data.difference_amount,
    ].every(isFiniteNumber)
  )
    throw new AppError("server");
  if (
    (data.special_discount !== undefined &&
      !isFiniteNumber(data.special_discount)) ||
    (data.original_final_price !== undefined &&
      !isFiniteNumber(data.original_final_price))
  )
    throw new AppError("server");
  const quote = data as unknown as ModificationQuoteDto;
  return {
    modificationRequestId:
      quote.modification_request_id === null
        ? null
        : String(quote.modification_request_id),
    count: quote.count,
    carPrice: quote.car_price,
    price: quote.price,
    deliveryFee: quote.deliver_fee,
    serviceFee: quote.service_fee,
    completionFee: quote.completion_fee,
    discount: quote.discount,
    specialDiscount: quote.special_discount ?? 0,
    additionalServicesCost: quote.additional_services_cost,
    totalPrice: quote.total_price,
    taxValue: quote.tax_value,
    finalPrice: quote.final_price,
    originalFinalPrice: quote.original_final_price ?? quote.final_price,
    newFinalPrice: quote.new_final_price,
    differenceAmount: quote.difference_amount,
  };
}

export function mapExtensionQuoteResponse(value: unknown): ExtensionQuote {
  const data = isRecord(value) ? value.data : undefined;
  if (
    !isApiEnvelope(value) ||
    value.code !== 200 ||
    !isRecord(data) ||
    ![
      data.count,
      data.car_price,
      data.price,
      data.additional_services_cost,
      data.offer_discount,
      data.late_fee,
      data.late_days,
      data.tax_value,
      data.tax_added_value,
      data.total_amount,
    ].every(isFiniteNumber) ||
    !isDatePart(data.new_delivery_day) ||
    typeof data.tax_type !== "string"
  )
    throw new AppError("server");

  const quote = data as unknown as ExtensionQuoteDto;
  return {
    count: quote.count,
    carPrice: quote.car_price,
    price: quote.price,
    additionalServicesCost: quote.additional_services_cost,
    offerDiscount: quote.offer_discount,
    newDeliveryDay: quote.new_delivery_day,
    lateFee: quote.late_fee,
    lateDays: quote.late_days,
    taxType: quote.tax_type,
    taxValue: quote.tax_value,
    taxAddedValue: quote.tax_added_value,
    totalAmount: quote.total_amount,
  };
}

function toOrderListItem(order: OrderListItemDto): OrderListItem {
  return {
    id: String(order.id),
    carName: order.car_name,
    carYear: order.car_year,
    carImage: order.car_image,
    date: order.date,
    status: order.status,
    lateHours: order.late_hours,
    companyName: order.company_name,
    companyLogo: order.company_logo,
    companyRate: order.company_rate,
    isRated: order.is_rated,
    myRating: {
      companyRate: order.my_rating.company_rate,
      driverRate: order.my_rating.driver_rate,
    },
  };
}

const toCoordinate = (value: OrderCoordinate): number | null =>
  value === null ? null : Number(value);

export function mapOrderResponse(value: unknown): Order {
  logBookingData("order response before DTO validation", value);
  const data = isRecord(value) ? value.data : undefined;
  if (!isApiEnvelope(value) || value.code !== 200 || !isOrderDto(data)) {
    throw new AppError("server");
  }

  return {
    id: String(data.id),
    orderNumber: data.order_number,
    userId: String(data.user_id),
    car: {
      id: String(data.car.id),
      imageUrl: data.car.image_url,
      year: data.car.year,
      companyName: data.car.company_name,
      companyLogo: data.car.company_logo,
      lowerPrice: data.car.lower_price,
      maxPrice: data.car.max_price,
      rate: data.car.rate,
      note: data.car.note,
      brand: {
        id: String(data.car.brand.id),
        title: data.car.brand.title,
        logo: data.car.brand.logo,
      },
      type: {
        id: String(data.car.type.id),
        title: data.car.type.title,
        logo: data.car.type.logo,
      },
      hasOffer: data.car.has_offer,
      offer: data.car.offer,
    },
    status: data.status,
    lateHours: data.late_hours,
    bookingType: data.booking_type,
    deliveryType: data.delivery_type,
    pickupAt: `${data.pickup_day}T${data.pickup_time}`,
    returnAt: `${data.delivery_day}T${data.delivery_time}`,
    pickupLocation: {
      latitude: toCoordinate(data.pickup_location.pickup_lat),
      longitude: toCoordinate(data.pickup_location.pickup_long),
      address: data.pickup_location.address,
    },
    deliveryLocation: {
      latitude: toCoordinate(data.delivery_location.delivery_lat),
      longitude: toCoordinate(data.delivery_location.delivery_long),
      address: data.delivery_location.address,
    },
    branch: {
      id: String(data.branch.id),
      title: data.branch.title,
      distanceKm: data.branch.distance_km,
      latitude: Number(data.branch.latitude),
      longitude: Number(data.branch.longitude),
      placeId: data.branch.place_id,
      region: data.branch.region,
      address: data.branch.address,
      logo: data.branch.logo,
    },
    note: data.note,
    carPrice: data.car_price,
    price: data.price,
    count: data.count,
    deliveryFee: data.delivery_fee,
    serviceFee: data.service_fee,
    completionFee: data.completion_fee,
    discount: data.discount,
    additionalServicesCost: data.additional_services_cost,
    totalPrice: data.total_price,
    taxValue: data.tax_value,
    finalPrice: data.final_price,
    cancellationFee: data.cancellation_fee,
    refundAmount: data.refund_amount,
    taxRate: data.tax_rate,
    taxRateType: data.tax_rate_type,
    serviceFeeRate: data.service_fee_rate,
    serviceFeeRateType: data.service_fee_rate_type,
    payExtension: data.pay_extension,
    pendingExtensionId:
      data.pending_extension_id === null
        ? null
        : String(data.pending_extension_id),
    hasModifyRequest: data.has_modify_request,
    modifyRequestPendingPayment: data.modify_request_pending_payment ?? false,
    modifyRequestPaymentAmount: data.modify_request_payment_amount ?? null,
    ...(data.has_driver === undefined ? {} : { hasDriver: data.has_driver }),
    isRated: data.is_rated,
    myRating: {
      companyRate: data.my_rating.company_rate,
      driverRate: data.my_rating.driver_rate,
    },
    createdAt: data.created_at,
    terms: sanitizeBackendHtml(data.terms),
  };
}

async function listOrders({
  status,
  page,
  perPage,
}: ListOrdersParams): Promise<Page<OrderListItem>> {
  const query = { status, page, per_page: perPage };
  logBookingData("request", { method: "GET", path: "/booking", query });
  const response = await serverHttp.get<ApiPage<unknown>>("/booking", {
    query,
  });
  logBookingData("response", {
    method: "GET",
    path: "/booking",
    data: response,
  });
  const orders = mapOrdersResponse(response);
  logBookingData("mapped response", {
    method: "GET",
    path: "/booking",
    data: orders,
  });
  return orders;
}

async function checkAvailability({
  carId,
  branchId,
  type,
  fromDay,
  toDay,
  count,
  deliveryType,
}: AvailabilityRequest): Promise<Availability> {
  const query = {
    car_id: Number(carId),
    branch_id: Number(branchId),
    type,
    from_day: fromDay,
    ...(toDay ? { to_day: toDay } : {}),
    ...(count ? { count } : {}),
    // Airport and station send no delivery_type.
    ...(deliveryType ? { delivery_type: deliveryType } : {}),
  };
  logBookingData("request", {
    method: "GET",
    path: "/booking/is-available-days",
    query,
  });
  const response = await serverHttp.get("/booking/is-available-days", {
    query,
  });
  logBookingData("response", {
    method: "GET",
    path: "/booking/is-available-days",
    data: response,
  });
  const availability = mapAvailabilityResponse(response);
  logBookingData("mapped response", {
    method: "GET",
    path: "/booking/is-available-days",
    data: availability,
  });
  return availability;
}

const formatApiDate = (value: Date): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/** Build E2's multipart body; the backend owns every price in the draft. */
export function toCreateDraftFormData(request: CreateDraftRequest): FormData {
  const form = new FormData();
  const { details } = request;
  form.set("car_id", request.carId);
  form.set("branch_id", request.branchId);
  form.set("type", request.bookingType);
  form.set("from_day", formatApiDate(details.startDate));
  form.set("time", details.time);
  // Only daily, monthly, and international have a delivery type.
  if (request.deliveryType) form.set("delivery_type", request.deliveryType);

  if (request.bookingType === "monthly") {
    form.set("count", String(details.months ?? details.days));
  } else {
    form.set("to_day", formatApiDate(details.endDate));
  }

  if (request.countryId) form.set("country_id", request.countryId);
  if (details.notes) form.set("note", details.notes);

  const pickup = details.pickupLocation;
  const dropoff = details.dropoffLocation;
  if (request.deliveryType === "to_location" && pickup && dropoff) {
    form.set("pickup_lat", String(pickup.lat));
    form.set("pickup_long", String(pickup.lng));
    form.set("pickup_region", pickup.region ?? "");
    form.set("pickup_address", details.pickupAddress ?? pickup.address);
    form.set("delivery_lat", String(dropoff.lat));
    form.set("delivery_long", String(dropoff.lng));
    form.set("delivery_region", dropoff.region ?? "");
    form.set("delivery_address", details.dropoffAddress ?? dropoff.address);
  }

  // Airport / station (create-booking doc): the server fills pickup_* from the
  // airport or station. delivery_to_*=1 returns the car there; with 0 the
  // client sends delivery_*. Station always sends delivery_* (known issue).
  if (request.bookingType === "airport" || request.bookingType === "station") {
    const airport = request.bookingType === "airport";
    if (airport && request.airportId) form.set("airport_id", request.airportId);
    if (!airport && request.stationId)
      form.set("train_station_id", request.stationId);
    form.set(
      airport ? "delivery_to_airport" : "delivery_to_station",
      request.returnAtPickupPoint ? "1" : "0",
    );
    const sendReturn = !airport || !request.returnAtPickupPoint;
    if (sendReturn && request.returnLocation) {
      const { lat, lng, region, address } = request.returnLocation;
      form.set("delivery_lat", String(lat));
      form.set("delivery_long", String(lng));
      form.set("delivery_region", region);
      form.set("delivery_address", address);
    }
  }

  for (const [index, service] of (request.services ?? []).entries()) {
    form.set(`service_id[${index}]`, service.id);
    form.set(`service_type[${index}]`, service.type);
  }

  return form;
}

async function createDraft(request: CreateDraftRequest): Promise<Order> {
  const form = toCreateDraftFormData(request);
  logBookingData("request", {
    method: "POST",
    path: "/booking/create-booking",
    body: Object.fromEntries(form.entries()),
  });
  const response = await serverHttp.post("/booking/create-booking", form);
  logBookingData("response", {
    method: "POST",
    path: "/booking/create-booking",
    data: response,
  });
  const order = mapOrderResponse(response);
  logBookingData("mapped response", {
    method: "POST",
    path: "/booking/create-booking",
    data: order,
  });
  return order;
}

async function getPaymentOptions(orderId: string): Promise<PaymentOptions> {
  const path = `/booking/${orderId}/payment-methods`;
  logBookingData("request", { method: "GET", path });
  const response = await serverHttp.get(path);
  logBookingData("response", { method: "GET", path, data: response });
  return mapPaymentOptionsResponse(response);
}

/** E5 multipart body (R7, R14): `use_wallet=1` and/or `payment_method_id`; never `use_points` (R13). */
export function toPayFormData(request: PayOrderRequest): FormData {
  const form = new FormData();
  form.set("order_id", request.orderId);
  if (request.useWallet) form.set("use_wallet", "1");
  if (request.paymentMethodId)
    form.set("payment_method_id", request.paymentMethodId);
  return form;
}

async function payOrder(
  request: PayOrderRequest,
): Promise<Result<PayOrderResult>> {
  try {
    const form = toPayFormData(request);
    logBookingData("request", {
      method: "POST",
      path: "/booking/pay",
      body: Object.fromEntries(form.entries()),
    });
    const response = await serverHttp.post("/booking/pay", form);
    logBookingData("response", {
      method: "POST",
      path: "/booking/pay",
      data: response,
    });
    const message = isApiEnvelope(response) ? response.message : undefined;
    return ok(mapPayResponse(response), message);
  } catch (error) {
    return fail(error);
  }
}

/** E12 uses the same wallet/gateway body and response as the draft payment. */
async function payModification(
  request: PayModificationRequest,
): Promise<Result<PayOrderResult>> {
  try {
    const form = toPayFormData(request);
    const path = "/booking/modification-requests-pay";
    logBookingData("request", {
      method: "POST",
      path,
      body: Object.fromEntries(form.entries()),
    });
    const response = await serverHttp.post(path, form);
    logBookingData("response", { method: "POST", path, data: response });
    logBookingData("modification payment response before validation", response);
    const message = isApiEnvelope(response) ? response.message : undefined;
    return ok(mapPayResponse(response), message);
  } catch (error) {
    return fail(error);
  }
}

export function toExtensionFormData(request: PayExtensionRequest): FormData {
  const form = new FormData();
  form.set("count", String(request.count));
  if (request.useWallet) form.set("use_wallet", "1");
  if (request.paymentMethodId)
    form.set("payment_method_id", request.paymentMethodId);
  return form;
}

async function payExtension(
  request: PayExtensionRequest,
): Promise<Result<PayExtensionResult>> {
  const path = `/booking/${request.orderId}/extensions`;
  try {
    const form = toExtensionFormData(request);
    const response = await serverHttp.post(path, form);
    const message = isApiEnvelope(response) ? response.message : undefined;
    return ok(mapExtensionPayResponse(response), message);
  } catch (error) {
    return fail(error);
  }
}

/** Debug output for local API integration work; never emitted by production builds. Removed in O12. */
function logBookingData(label: string, value: unknown): void {
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console -- intentional local API integration inspection.
    console.info(`[orders] ${label}`, value);
  }
}

async function getOrder(id: string): Promise<Order> {
  logBookingData("request", { method: "GET", path: `/booking/${id}` });
  const response = await serverHttp.get(`/booking/${id}`);
  logBookingData("response", {
    method: "GET",
    path: `/booking/${id}`,
    data: response,
  });
  const order = mapOrderResponse(response);
  logBookingData("mapped detail model", order);
  return order;
}

async function getCancelQuote(id: string): Promise<CancelQuote> {
  const path = `/booking/${id}/cancel`;
  const query = { is_quote: 1 };
  logBookingData("request", { method: "POST", path, query });
  const response = await serverHttp.post(path, undefined, { query });
  logBookingData("response", { method: "POST", path, data: response });
  return mapCancelQuoteResponse(response);
}

async function getExtensionQuote(
  id: string,
  count: number,
): Promise<ExtensionQuote> {
  const path = `/booking/${id}/extension-quote`;
  const query = { count };
  const response = await serverHttp.get(path, { query });
  return mapExtensionQuoteResponse(response);
}

async function cancelBooking(id: string): Promise<string | undefined> {
  const path = `/booking/${id}/cancel`;
  const query = { is_quote: 0 };
  logBookingData("request", { method: "POST", path, query });
  const response = await serverHttp.post(path, undefined, { query });
  logBookingData("response", { method: "POST", path, data: response });
  mapCancelConfirmationResponse(response);
  return isApiEnvelope(response) ? response.message : undefined;
}

export function toModificationFormData(request: ModificationRequest): FormData {
  const form = new FormData();
  form.set("type", request.type);
  form.set("store", request.store ? "1" : "0");
  if (request.count !== undefined) form.set("count", String(request.count));
  if (request.pickupTime) form.set("pickup_time", request.pickupTime);
  return form;
}

async function requestModification(
  id: string,
  request: ModificationRequest,
): Promise<ModificationQuote> {
  const path = `/booking/${id}/modification-requests`;
  const form = toModificationFormData(request);
  logBookingData("request", {
    method: "POST",
    path,
    body: Object.fromEntries(form.entries()),
  });
  try {
    const response = await serverHttp.post(path, form);
    logBookingData("response", { method: "POST", path, data: response });
    return mapModificationQuoteResponse(response);
  } catch (error) {
    const appError = error instanceof AppError ? error : undefined;
    logBookingData("response error", {
      method: "POST",
      path,
      status: appError?.status,
      kind: appError?.kind,
      message: appError?.serverMessage,
    });
    throw error;
  }
}

/**
 * O3 makes the list and details live. O7 also replaces the cancel mock with
 * the quote and cancellation endpoints; the remaining writes stay mocked.
 */
export const bookingsApi: BookingsApi = {
  checkAvailability,
  listOrders,
  getOrder,
  // O8 replaces extension.
  extendBooking: (...args) => bookingsMock.extendBooking(...args),
  getExtensionQuote,
  // O10 replaces modification requests.
  requestBookingEdit: (...args) => bookingsMock.requestBookingEdit(...args),
  requestModification,
  getCancelQuote,
  cancelBooking,
  // O11 replaces reviews.
  submitReview: (...args) => bookingsMock.submitReview(...args),
  createDraft,
  getPaymentOptions,
  payOrder,
  payModification,
  payExtension,
};
