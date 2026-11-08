import "server-only";
import type { ApiPage, ApiPagination } from "@/services/http/envelope";
import { isApiEnvelope } from "@/services/http/envelope";
import { serverHttp } from "@/services/http/server";
import { AppError } from "@/shared/lib/errors";
import { toPage, type Page } from "@/shared/lib/pagination";
import { bookingsMock } from "./api.mock";
import type {
  BookingDetailsView,
  BookingEditRequest,
  BookingReviewInput,
  CreateBookingRequest,
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
  listOrders(params: ListOrdersParams): Promise<Page<OrderListItem>>;
  /** Throws a `not_found` AppError for an unknown id. */
  getBookingDetails(id: string): Promise<BookingDetailsView>;
  /** `days` is the new total rental length. */
  extendBooking(id: string, days: number): Promise<void>;
  requestBookingEdit(id: string, request: BookingEditRequest): Promise<void>;
  cancelBooking(id: string): Promise<void>;
  submitReview(id: string, input: BookingReviewInput): Promise<void>;
  createBooking(request: CreateBookingRequest): Promise<void>;
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isNullableNumber = (value: unknown): value is number | null =>
  value === null || isFiniteNumber(value);

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === "string";

/**
 * E6 sends 'YYYY-MM-DD HH:mm' (§4.2); a 'T' separator and seconds are also
 * accepted. It must be a real date: rendering an invalid one would throw.
 */
const isListDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(?::\d{2})?$/.test(value) &&
  !Number.isNaN(new Date(value.replace(" ", "T")).getTime());

const isOrderStatus = (value: unknown): value is OrderStatus =>
  ORDER_STATUSES.some((status) => status === value);

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

async function listOrders({
  status,
  page,
  perPage,
}: ListOrdersParams): Promise<Page<OrderListItem>> {
  const response = await serverHttp.get<ApiPage<unknown>>("/booking", {
    query: { status, page, per_page: perPage },
  });
  return mapOrdersResponse(response);
}

/**
 * O2 makes only the list live. The remaining methods deliberately forward to
 * the stateless mock until their named booking API fractions replace them.
 */
export const bookingsApi: BookingsApi = {
  listOrders,
  // O3 replaces booking details.
  getBookingDetails: (...args) => bookingsMock.getBookingDetails(...args),
  // O8 replaces extension.
  extendBooking: (...args) => bookingsMock.extendBooking(...args),
  // O10 replaces modification requests.
  requestBookingEdit: (...args) => bookingsMock.requestBookingEdit(...args),
  // O7 replaces cancellation.
  cancelBooking: (...args) => bookingsMock.cancelBooking(...args),
  // O11 replaces reviews.
  submitReview: (...args) => bookingsMock.submitReview(...args),
  // O5 replaces draft creation (payment follows in O6).
  createBooking: (...args) => bookingsMock.createBooking(...args),
};
