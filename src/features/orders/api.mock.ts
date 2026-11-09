import { orderTabForStatus, type Order, type OrderListItem } from "./model";
import { AppError } from "@/shared/lib/errors";
import { toPage, type Page } from "@/shared/lib/pagination";
import { MOCK_OFFICES } from "@/services/mocks/offices";
import type { BookingsApi } from "./api";

const car1 = "/mock/cars/creta.jpg";

function getShowroomLogo(showroom: string): string | undefined {
  return (
    MOCK_OFFICES.find((office) => office.showroom === showroom)?.logo ??
    MOCK_OFFICES[0]?.logo
  );
}

export const MOCK_ORDER_LIST: OrderListItem[] = [
  {
    id: "1",
    carName: "Chevrolet Malibu",
    carYear: 2022,
    carImage: car1,
    date: "2026-06-30 23:46",
    status: "current",
    lateHours: null,
    companyName: "Al-Quds showroom",
    companyLogo: getShowroomLogo("معرض القدس") ?? null,
    companyRate: 4.4,
    isRated: false,
    myRating: { companyRate: null, driverRate: null },
  },
  {
    id: "2",
    carName: "Nissan Altima",
    carYear: 2022,
    carImage: car1,
    date: "2026-07-18 13:15",
    status: "coming",
    lateHours: null,
    companyName: "Gulf showroom",
    companyLogo: getShowroomLogo("معرض الخليج") ?? null,
    companyRate: 4.5,
    isRated: false,
    myRating: { companyRate: null, driverRate: null },
  },
  {
    id: "3",
    carName: "Honda Accord",
    carYear: 2023,
    carImage: car1,
    date: "2026-06-30 23:46",
    status: "late",
    lateHours: 6,
    companyName: "Al-Orouba showroom",
    companyLogo: getShowroomLogo("معرض العروبة") ?? null,
    companyRate: 4.6,
    isRated: false,
    myRating: { companyRate: null, driverRate: null },
  },
  {
    id: "4",
    carName: "Mazda 6",
    carYear: 2024,
    carImage: car1,
    date: "2026-04-08 12:00",
    status: "complete",
    lateHours: null,
    companyName: "Elite showroom",
    companyLogo: getShowroomLogo("معرض النخبة") ?? null,
    companyRate: 4.8,
    isRated: true,
    myRating: { companyRate: 5, driverRate: 4 },
  },
  {
    id: "5",
    carName: "Chevrolet Impala",
    carYear: 2021,
    carImage: car1,
    date: "2026-03-22 19:45",
    status: "cancelled",
    lateHours: null,
    companyName: "Al-Quds showroom",
    companyLogo: getShowroomLogo("معرض القدس") ?? null,
    companyRate: 4.2,
    isRated: false,
    myRating: { companyRate: null, driverRate: null },
  },
];

export const MOCK_ORDERS: Order[] = MOCK_ORDER_LIST.map((item) => ({
  id: item.id,
  orderNumber: `ORD-MOCK-${item.id}`,
  userId: "1",
  car: {
    id: item.id,
    imageUrl: item.carImage,
    year: item.carYear,
    companyName: item.companyName,
    companyLogo: item.companyLogo,
    lowerPrice: 500,
    maxPrice: 600,
    rate: item.companyRate,
    note: null,
    brand: { id: "1", title: item.carName.split(" ")[0], logo: null },
    type: {
      id: "1",
      title: item.carName.split(" ").slice(1).join(" ") || item.carName,
      logo: null,
    },
    hasOffer: false,
    offer: null,
  },
  status: item.status,
  lateHours: item.lateHours,
  bookingType: "daily",
  deliveryType: "from_branch",
  pickupAt: "2026-08-13T16:30:00",
  returnAt: "2026-08-24T16:30:00",
  pickupLocation: { latitude: null, longitude: null, address: null },
  deliveryLocation: { latitude: null, longitude: null, address: null },
  branch: {
    id: "1",
    title: "Riyadh branch",
    distanceKm: null,
    latitude: 24.7136,
    longitude: 46.6753,
    placeId: "mock-place",
    region: "Riyadh",
    address: "King Abdullah Road, Riyadh",
    logo: item.companyLogo,
  },
  note: null,
  carPrice: 500,
  price: 2500,
  count: 5,
  deliveryFee: 0,
  serviceFee: 100,
  completionFee: 25,
  discount: 0,
  totalPrice: 2625,
  taxValue: 262.5,
  finalPrice: 2887.5,
  cancellationFee: item.status === "cancelled" ? 100 : 0,
  refundAmount: item.status === "cancelled" ? 2787.5 : 0,
  taxRate: 10,
  taxRateType: "percent",
  serviceFeeRate: 0,
  serviceFeeRateType: "percent",
  payExtension: false,
  pendingExtensionId: null,
  hasModifyRequest: false,
  hasDriver: false,
  isRated: item.isRated,
  myRating: item.myRating,
  createdAt: "2026-06-01 12:00:00",
  terms: "<p>Return the car on time.</p>",
}));

/** Mock only: extensions past this many total days fail reproducibly. */
const MOCK_MAX_RENTAL_DAYS = 30;
/** Mock only: page 99 fails reproducibly so the paginated error state can be exercised. */
const MOCK_LIST_FAILURE_PAGE = 99;
/** Mock only: this id fails reproducibly so the details error boundary can be exercised. */
const MOCK_DETAILS_FAILURE_ID = "server-error";
/** Mock only: branch 422 reproduces the backend's unavailable-days response. */
const MOCK_UNAVAILABLE_BRANCH_ID = "422";

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

function findOrder(id: string): Order {
  if (id === MOCK_DETAILS_FAILURE_ID) throw new AppError("server");
  const order = MOCK_ORDERS.find((item) => item.id === id);
  if (!order) throw new AppError("not_found", "bookings.notFound");
  return order;
}

function findActiveOrder(id: string): Order {
  const order = findOrder(id);
  if (orderTabForStatus(order.status) !== "active")
    throw new AppError("conflict", "bookings.notActive");
  return order;
}

// Stateless/read-only: safe on the server. Writes validate but do not mutate.
export const bookingsMock: BookingsApi = {
  async checkAvailability({ branchId }) {
    await delay();
    if (branchId === MOCK_UNAVAILABLE_BRANCH_ID) {
      throw new AppError("validation", undefined, 422, undefined, {
        serverMessage: "The car is not available for the selected days.",
      });
    }
    return {
      slots: ["08", "09", "10", "11", "12", "13", "14"],
      message: "Fetched successfully.",
    };
  },

  async listOrders({ status, page, perPage }): Promise<Page<OrderListItem>> {
    await delay();
    if (page === MOCK_LIST_FAILURE_PAGE) throw new AppError("server");
    const tab = status === "current" ? "active" : "past";
    const items = MOCK_ORDER_LIST.filter(
      (booking) => orderTabForStatus(booking.status) === tab,
    );
    const start = (page - 1) * perPage;
    return toPage(items.slice(start, start + perPage), {
      current_page: page,
      last_page: Math.max(1, Math.ceil(items.length / perPage)),
      total: items.length,
    });
  },

  async getOrder(id) {
    await delay();
    return findOrder(id);
  },

  async extendBooking(id, days) {
    await delay(600);
    findActiveOrder(id);
    if (days > MOCK_MAX_RENTAL_DAYS)
      throw new AppError("conflict", "bookings.extendLimit");
  },

  async requestBookingEdit(id, request) {
    await delay(600);
    findActiveOrder(id);
    if (request.endDate <= request.startDate) {
      throw new AppError("validation", "bookings.invalidDates", undefined, {
        endDate: "bookings.invalidDates",
      });
    }
  },

  async cancelBooking(id) {
    await delay(600);
    const order = findActiveOrder(id);
    if (order.status === "late")
      throw new AppError("conflict", "bookings.cancelNotAllowed");
  },

  async submitReview(id, { showroomRating, driverRating }) {
    await delay(600);
    findOrder(id);
    if (
      !Number.isInteger(showroomRating) ||
      showroomRating < 1 ||
      showroomRating > 5
    ) {
      throw new AppError("validation", "bookings.ratingRequired", undefined, {
        showroomRating: "bookings.ratingRequired",
      });
    }
    if (
      !Number.isInteger(driverRating) ||
      driverRating < 1 ||
      driverRating > 5
    ) {
      throw new AppError("validation", "bookings.ratingRequired", undefined, {
        driverRating: "bookings.ratingRequired",
      });
    }
  },

  async createBooking({ details }) {
    await delay(800);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (details.startDate < today) {
      throw new AppError("validation", "booking.startInPast", undefined, {
        startDate: "booking.startInPast",
      });
    }
    if (details.days > MOCK_MAX_RENTAL_DAYS)
      throw new AppError("conflict", "booking.carUnavailable");
  },
};
