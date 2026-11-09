import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/shared/lib/errors";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/services/http/server", () => ({ serverHttp: { get } }));

import { bookingsApi, mapOrderResponse, mapOrdersResponse } from "./api";

const response = {
  data: [
    {
      id: 153,
      car_image: "https://example.com/car.jpg",
      car_name: "Toyota Avalon",
      car_year: 2025,
      date: "2026-11-10 09:30",
      status: "late",
      late_hours: 5,
      company_name: "Example company",
      company_rate: 3.8,
      company_logo: null,
      is_rated: false,
      my_rating: { company_rate: null, driver_rate: null },
    },
  ],
  message: "Fetched successfully.",
  code: 200,
  pagination: {
    current_page: 2,
    last_page: 4,
    per_page: 10,
    total: 31,
    from: 11,
    to: 20,
  },
};

const orderResponse = {
  data: {
    id: 153,
    order_number: "ORD-6984BC6E",
    user_id: 42,
    car: {
      id: 7,
      image_url: "https://example.com/car.jpg",
      year: 2025,
      company_name: "Example company",
      company_logo: null,
      lower_price: 90,
      max_price: 120,
      rate: 4.5,
      note: null,
      brand: { id: 1, title: "Toyota", logo: null },
      type: { id: 2, title: "Avalon", logo: null },
      has_offer: false,
      offer: null,
    },
    status: "late",
    late_hours: 5,
    booking_type: "daily",
    delivery_type: "from_location",
    pickup_day: "2026-11-10",
    delivery_day: "2026-11-12",
    pickup_time: "09:30:00",
    delivery_time: "10:45:00",
    pickup_location: {
      pickup_lat: "24.7136",
      pickup_long: "46.6753",
      address: "Pickup address",
    },
    delivery_location: {
      delivery_lat: "24.7000",
      delivery_long: "46.6000",
      address: "Return address",
    },
    branch: {
      id: 3,
      title: "Riyadh branch",
      distance_km: null,
      latitude: "24.7136",
      longitude: "46.6753",
      place_id: "place-1",
      region: "Riyadh",
      address: "Branch address",
      logo: null,
    },
    note: "Please call first",
    car_price: 45,
    price: 90,
    count: 2,
    delivery_fee: 10,
    service_fee: 9,
    completion_fee: 3,
    discount: 5,
    coupon_code: null,
    coupon_discount: 0,
    additional_services_cost: 10,
    total_price: 112,
    tax_value: 11.2,
    final_price: 123.2,
    cancellation_fee: 0,
    refund_amount: 0,
    tax_rate: 10,
    tax_rate_type: "percent",
    service_fee_rate: 10,
    service_fee_rate_type: "percent",
    pay_extension: false,
    pending_extension_id: null,
    has_modify_request: false,
    has_driver: false,
    is_rated: false,
    my_rating: { company_rate: null, driver_rate: null },
    created_at: "2026-11-08 12:00:00",
    terms:
      '<p onclick="steal()">Return on time.</p><script>alert(1)</script>',
  },
  message: "Fetched successfully.",
  code: 200,
};

describe("orders list API", () => {
  beforeEach(() => get.mockReset());

  it("maps a valid list DTO and its pagination", () => {
    expect(mapOrdersResponse(response)).toEqual({
      items: [
        {
          id: "153",
          carImage: "https://example.com/car.jpg",
          carName: "Toyota Avalon",
          carYear: 2025,
          date: "2026-11-10 09:30",
          status: "late",
          lateHours: 5,
          companyName: "Example company",
          companyRate: 3.8,
          companyLogo: null,
          isRated: false,
          myRating: { companyRate: null, driverRate: null },
        },
      ],
      page: 2,
      lastPage: 4,
      total: 31,
    });
  });

  it("rejects a DTO with a missing field as a server error", () => {
    const { company_name: _missing, ...item } = response.data[0];
    expectServerError(() => mapOrdersResponse({ ...response, data: [item] }));
  });

  it("rejects an unknown status as a server error", () => {
    expectServerError(() =>
      mapOrdersResponse({
        ...response,
        data: [{ ...response.data[0], status: "mystery" }],
      }),
    );
  });

  it("rejects an impossible date as a server error", () => {
    expectServerError(() =>
      mapOrdersResponse({
        ...response,
        data: [{ ...response.data[0], date: "2026-13-45 99:99" }],
      }),
    );
  });

  it("rejects a response without pagination as a server error", () => {
    const { pagination: _missing, ...withoutPagination } = response;
    expectServerError(() => mapOrdersResponse(withoutPagination));
  });

  it("sends status, page, and per_page to E6", async () => {
    get.mockResolvedValue(response);
    await bookingsApi.listOrders({ status: "past", page: 2, perPage: 10 });
    expect(get).toHaveBeenCalledWith("/booking", {
      query: { status: "past", page: 2, per_page: 10 },
    });
  });
});

describe("order details API", () => {
  beforeEach(() => get.mockReset());

  it("maps a valid OrderDto, numeric-string coordinates, and date-times", () => {
    expect(mapOrderResponse(orderResponse)).toMatchObject({
      id: "153",
      orderNumber: "ORD-6984BC6E",
      userId: "42",
      status: "late",
      deliveryType: "from_location",
      pickupAt: "2026-11-10T09:30:00",
      returnAt: "2026-11-12T10:45:00",
      pickupLocation: {
        latitude: 24.7136,
        longitude: 46.6753,
        address: "Pickup address",
      },
      branch: { id: "3", latitude: 24.7136, longitude: 46.6753 },
      price: 90,
      finalPrice: 123.2,
      pendingExtensionId: null,
    });
  });

  it("rejects an OrderDto with a missing field", () => {
    const { order_number: _missing, ...data } = orderResponse.data;
    expectServerError(() => mapOrderResponse({ ...orderResponse, data }));
  });

  it("rejects an unknown details status", () => {
    expectServerError(() =>
      mapOrderResponse({
        ...orderResponse,
        data: { ...orderResponse.data, status: "mystery" },
      }),
    );
  });

  it("rejects a non-numeric coordinate and accepts an unknown delivery type", () => {
    expectServerError(() =>
      mapOrderResponse({
        ...orderResponse,
        data: {
          ...orderResponse.data,
          branch: { ...orderResponse.data.branch, latitude: "0x1A" },
        },
      }),
    );
    // The guard accepts any string: booking 153 answers from_location (Q5b).
    const order = mapOrderResponse({
      ...orderResponse,
      data: { ...orderResponse.data, delivery_type: "by_drone" },
    });
    expect(order.deliveryType).toBe("by_drone");
  });

  it("accepts null location fields", () => {
    const order = mapOrderResponse({
      ...orderResponse,
      data: {
        ...orderResponse.data,
        delivery_type: "from_branch",
        pickup_location: {
          pickup_lat: null,
          pickup_long: null,
          address: null,
        },
        delivery_location: {
          delivery_lat: null,
          delivery_long: null,
          address: null,
        },
      },
    });

    expect(order.pickupLocation).toEqual({
      latitude: null,
      longitude: null,
      address: null,
    });
  });

  it("accepts a booking without the optional has_driver field", () => {
    const { has_driver: _missing, ...data } = orderResponse.data;
    const order = mapOrderResponse({
      ...orderResponse,
      data: { ...data, created_at: null },
    });

    expect(order.createdAt).toBeNull();
    expect(order).not.toHaveProperty("hasDriver");
  });

  it("sanitizes terms on the server", () => {
    const order = mapOrderResponse(orderResponse);
    expect(order.terms).toBe("<p>Return on time.</p>");
  });

  it("requests E7 by id", async () => {
    get.mockResolvedValue(orderResponse);
    await expect(bookingsApi.getOrder("153")).resolves.toMatchObject({
      id: "153",
    });
    expect(get).toHaveBeenCalledWith("/booking/153");
  });

  it("preserves E7 not-found errors from the HTTP client", async () => {
    const notFound = new AppError("not_found");
    get.mockImplementationOnce(async () => {
      throw notFound;
    });

    await expect(bookingsApi.getOrder("99999999")).rejects.toBe(notFound);
  });
});

function expectServerError(read: () => unknown) {
  try {
    read();
    throw new Error("Expected the response guard to throw");
  } catch (error) {
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).kind).toBe("server");
  }
}
