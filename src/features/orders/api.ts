import "server-only";
import type { ApiPage, ApiPagination } from "@/services/http/envelope";
import { isApiEnvelope } from "@/services/http/envelope";
import { serverHttp } from "@/services/http/server";
import { AppError } from "@/shared/lib/errors";
import { toPage, type Page } from "@/shared/lib/pagination";
import { sanitizeBackendHtml } from "@/shared/lib/sanitizeHtml";
import { bookingsMock } from "./api.mock";
import type {
  Availability,
  AvailabilityRequest,
  BookingType,
  BookingEditRequest,
  BookingReviewInput,
  CreateDraftRequest,
  CreateBookingRequest,
  Order,
  OrderListItem,
  OrderStatus,
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
  /** `days` is the new total rental length. */
  extendBooking(id: string, days: number): Promise<void>;
  requestBookingEdit(id: string, request: BookingEditRequest): Promise<void>;
  cancelBooking(id: string): Promise<void>;
  submitReview(id: string, input: BookingReviewInput): Promise<void>;
  createBooking(request: CreateBookingRequest): Promise<void>;
  createDraft(request: CreateDraftRequest): Promise<Order>;
}

export interface AvailabilityDto {
  slots: { time: string }[];
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
    pickup_lat: string | null;
    pickup_long: string | null;
    address: string | null;
  };
  delivery_location: {
    delivery_lat: string | null;
    delivery_long: string | null;
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
  has_driver?: boolean;
  is_rated: boolean;
  my_rating: { company_rate: number | null; driver_rate: number | null };
  created_at: string | null;
  terms: string;
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

const isNullableNumericString = (value: unknown): value is string | null =>
  value === null || isNumericString(value);

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
    isNullableNumericString(value.pickup_lat) &&
    isNullableNumericString(value.pickup_long) &&
    isNullableString(value.address)
  );
}

function isDeliveryLocation(
  value: unknown,
): value is OrderDto["delivery_location"] {
  return (
    isRecord(value) &&
    isNullableNumericString(value.delivery_lat) &&
    isNullableNumericString(value.delivery_long) &&
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

const toCoordinate = (value: string | null): number | null =>
  value === null ? null : Number(value);

export function mapOrderResponse(value: unknown): Order {
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
  const response = await serverHttp.get<ApiPage<unknown>>("/booking", { query });
  logBookingData("response", { method: "GET", path: "/booking", data: response });
  const orders = mapOrdersResponse(response);
  logBookingData("mapped response", { method: "GET", path: "/booking", data: orders });
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
    delivery_type: deliveryType,
  };
  logBookingData("request", {
    method: "GET",
    path: "/booking/is-available-days",
    query,
  });
  const response = await serverHttp.get("/booking/is-available-days", { query });
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
  form.set("delivery_type", request.deliveryType);

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
  const response = await serverHttp.post(
    "/booking/create-booking",
    form,
  );
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

/**
 * O3 makes the list and details live. The remaining methods forward to
 * the stateless mock until their named booking API fractions replace them.
 */
export const bookingsApi: BookingsApi = {
  checkAvailability,
  listOrders,
  getOrder,
  // O8 replaces extension.
  extendBooking: (...args) => bookingsMock.extendBooking(...args),
  // O10 replaces modification requests.
  requestBookingEdit: (...args) => bookingsMock.requestBookingEdit(...args),
  // O7 replaces cancellation.
  cancelBooking: (...args) => bookingsMock.cancelBooking(...args),
  // O11 replaces reviews.
  submitReview: (...args) => bookingsMock.submitReview(...args),
  // O5 sends real booking creation (payment follows in O6).
  createBooking: (...args) => bookingsMock.createBooking(...args),
  createDraft,
};
