import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/shared/lib/errors";

const { get, post } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/services/http/server", () => ({ serverHttp: { get, post } }));

import {
  bookingsApi,
  mapAvailabilityResponse,
  mapCancelQuoteResponse,
  mapOrderResponse,
  mapOrdersResponse,
  mapPaymentOptionsResponse,
  mapPayResponse,
  toCreateDraftFormData,
  toPayFormData,
} from "./api";
import type { CreateDraftRequest } from "./model";

const availabilityResponse = {
  data: { slots: [{ time: "08" }, { time: "21" }] },
  message: "Fetched successfully.",
  code: 200,
};

describe("availability API", () => {
  beforeEach(() => get.mockReset());

  it("maps the strict E1 DTO to pickup-hour strings", () => {
    expect(mapAvailabilityResponse(availabilityResponse)).toEqual({
      slots: ["08", "21"],
      message: "Fetched successfully.",
    });
  });

  it("rejects a malformed E1 slot as a server error", () => {
    expectServerError(() =>
      mapAvailabilityResponse({
        ...availabilityResponse,
        data: { slots: [{ time: "08:00" }] },
      }),
    );
  });

  it("sends the daily rental context using E1 query names", async () => {
    get.mockResolvedValue(availabilityResponse);

    await expect(
      bookingsApi.checkAvailability({
        carId: "1",
        branchId: "3",
        type: "daily",
        fromDay: "2026-11-10",
        toDay: "2026-11-12",
        deliveryType: "to_location",
      }),
    ).resolves.toEqual({
      slots: ["08", "21"],
      message: "Fetched successfully.",
    });
    expect(get).toHaveBeenCalledWith("/booking/is-available-days", {
      query: {
        car_id: 1,
        branch_id: 3,
        type: "daily",
        from_day: "2026-11-10",
        to_day: "2026-11-12",
        delivery_type: "to_location",
      },
    });
  });
});

describe("create draft API", () => {
  it("builds E2 multipart fields without client prices", () => {
    const request: CreateDraftRequest = {
      carId: "1",
      branchId: "3",
      bookingType: "daily",
      deliveryType: "to_location",
      details: {
        startDate: new Date(2026, 10, 10),
        endDate: new Date(2026, 10, 12),
        time: "09",
        days: 2,
        pricePerDay: 500,
        subtotal: 1000,
        vat: 150,
        total: 1150,
        notes: "Need help",
        pickupLocation: {
          lat: 24.7,
          lng: 46.6,
          address: "Pickup",
          region: "Riyadh",
        },
        dropoffLocation: {
          lat: 24.8,
          lng: 46.7,
          address: "Dropoff",
          region: "Riyadh",
        },
      },
      services: [{ id: "3", type: "driver_service" }],
    };

    const form = toCreateDraftFormData(request);

    expect(Object.fromEntries(form.entries())).toEqual({
      car_id: "1",
      branch_id: "3",
      type: "daily",
      from_day: "2026-11-10",
      to_day: "2026-11-12",
      time: "09",
      delivery_type: "to_location",
      pickup_lat: "24.7",
      pickup_long: "46.6",
      pickup_region: "Riyadh",
      pickup_address: "Pickup",
      delivery_lat: "24.8",
      delivery_long: "46.7",
      delivery_region: "Riyadh",
      delivery_address: "Dropoff",
      note: "Need help",
      "service_id[0]": "3",
      "service_type[0]": "driver_service",
    });
    expect(form.has("subtotal")).toBe(false);
    expect(form.has("vat")).toBe(false);
  });
});

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
    terms: '<p onclick="steal()">Return on time.</p><script>alert(1)</script>',
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

  it("accepts numeric airport location coordinates", () => {
    const order = mapOrderResponse({
      ...orderResponse,
      data: {
        ...orderResponse.data,
        booking_type: "airport",
        pickup_location: {
          pickup_lat: 30.043518,
          pickup_long: 31.218555,
          address: "Airport pickup",
        },
        delivery_location: {
          delivery_lat: 30.043518,
          delivery_long: 31.218555,
          address: "Airport return",
        },
      },
    });

    expect(order.pickupLocation).toEqual({
      latitude: 30.043518,
      longitude: 31.218555,
      address: "Airport pickup",
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

const paymentOptionsResponse = {
  data: {
    payment_methods: [
      { id: 6, title: "Online Payment", type: "online", icon: "bi-globe" },
      { id: 7, title: "Tabby", type: "tabby", icon: "bi-credit-card" },
    ],
    wallet_balance: 120.5,
    points: 40,
    points_value: 4,
  },
  message: "Fetched successfully.",
  code: 200,
};

const gatewayResponse = {
  data: {
    payment_url: "https://t-car.app/order/pay/226?amount=123.2&locale=en",
    success_url: "https://t-car.app/order/success/226",
    fail_url: "https://t-car.app/order/fail/226",
  },
  message: "Proceed to payment now.",
  code: 200,
};

describe("payment options API (E3)", () => {
  beforeEach(() => get.mockReset());

  it("maps methods and the wallet balance, without points or icon classes", () => {
    expect(mapPaymentOptionsResponse(paymentOptionsResponse)).toEqual({
      methods: [
        { id: "6", title: "Online Payment", type: "online" },
        { id: "7", title: "Tabby", type: "tabby" },
      ],
      walletBalance: 120.5,
    });
  });

  it("keeps a method without type (Bruno shape) with an empty type", () => {
    const { methods } = mapPaymentOptionsResponse({
      ...paymentOptionsResponse,
      data: {
        ...paymentOptionsResponse.data,
        payment_methods: [{ id: 6, title: "Online Payment", icon: "bi-globe" }],
      },
    });
    expect(methods).toEqual([{ id: "6", title: "Online Payment", type: "" }]);
  });

  it("rejects a missing wallet balance as a server error", () => {
    expectServerError(() =>
      mapPaymentOptionsResponse({
        ...paymentOptionsResponse,
        data: { payment_methods: [] },
      }),
    );
  });

  it("requests E3 for the order", async () => {
    get.mockResolvedValue(paymentOptionsResponse);
    await bookingsApi.getPaymentOptions("226");
    expect(get).toHaveBeenCalledWith("/booking/226/payment-methods");
  });
});

describe("pay API (E5)", () => {
  beforeEach(() => post.mockReset());

  it("maps gateway links", () => {
    expect(mapPayResponse(gatewayResponse)).toEqual({
      kind: "gateway",
      payment: {
        paymentUrl: "https://t-car.app/order/pay/226?amount=123.2&locale=en",
        successUrl: "https://t-car.app/order/success/226",
        failUrl: "https://t-car.app/order/fail/226",
      },
    });
  });

  it("maps data: null to a payment the wallet covered", () => {
    expect(
      mapPayResponse({ data: null, message: "Payment successful.", code: 200 }),
    ).toEqual({ kind: "paid" });
  });

  it("rejects a non-https gateway link as a server error", () => {
    expectServerError(() =>
      mapPayResponse({
        ...gatewayResponse,
        data: { ...gatewayResponse.data, payment_url: "javascript:alert(1)" },
      }),
    );
  });

  it("sends use_wallet and payment_method_id only when chosen, never use_points", () => {
    const both = toPayFormData({
      orderId: "226",
      useWallet: true,
      paymentMethodId: "6",
    });
    expect(Object.fromEntries(both.entries())).toEqual({
      order_id: "226",
      use_wallet: "1",
      payment_method_id: "6",
    });
    const methodOnly = toPayFormData({
      orderId: "226",
      useWallet: false,
      paymentMethodId: "6",
    });
    expect(Object.fromEntries(methodOnly.entries())).toEqual({
      order_id: "226",
      payment_method_id: "6",
    });
    const walletOnly = toPayFormData({
      orderId: "226",
      useWallet: true,
      paymentMethodId: null,
    });
    expect(Object.fromEntries(walletOnly.entries())).toEqual({
      order_id: "226",
      use_wallet: "1",
    });
  });

  it("returns the backend message on success and a 422 as a failed Result", async () => {
    post.mockResolvedValueOnce(gatewayResponse);
    await expect(
      bookingsApi.payOrder({
        orderId: "226",
        useWallet: false,
        paymentMethodId: "6",
      }),
    ).resolves.toMatchObject({
      ok: true,
      message: "Proceed to payment now.",
      data: { kind: "gateway" },
    });
    expect(post).toHaveBeenCalledWith("/booking/pay", expect.any(FormData));

    post.mockRejectedValueOnce(
      new AppError("validation", undefined, 422, undefined, {
        serverMessage: "This order has already been paid.",
      }),
    );
    const failed = await bookingsApi.payOrder({
      orderId: "226",
      useWallet: true,
      paymentMethodId: null,
    });
    expect(failed.ok).toBe(false);
    expect(failed.ok ? undefined : failed.error.serverMessage).toBe(
      "This order has already been paid.",
    );
  });
});

describe("cancel API (E8)", () => {
  beforeEach(() => post.mockReset());

  const quoteResponse = {
    data: {
      payed_amount: 2500,
      can_cancel_fee_amount: 1000,
      cancel_fee_percentage: 25,
      total: 1500,
    },
    message: "Cancellation quote fetched successfully.",
    code: 200,
  };

  it("maps the cancellation quote", () => {
    expect(mapCancelQuoteResponse(quoteResponse)).toEqual({
      paidAmount: 2500,
      cancellationFee: 1000,
      discountPercent: 25,
      total: 1500,
    });
  });

  it("requests the quote with is_quote=1", async () => {
    post.mockResolvedValue(quoteResponse);

    await expect(bookingsApi.getCancelQuote("153")).resolves.toEqual({
      paidAmount: 2500,
      cancellationFee: 1000,
      discountPercent: 25,
      total: 1500,
    });
    expect(post).toHaveBeenCalledWith("/booking/153/cancel", undefined, {
      query: { is_quote: 1 },
    });
  });

  it("posts is_quote=0 and validates the cancelled order response", async () => {
    post.mockResolvedValue(orderResponse);

    await expect(bookingsApi.cancelBooking("153")).resolves.toBeUndefined();
    expect(post).toHaveBeenCalledWith("/booking/153/cancel", undefined, {
      query: { is_quote: 0 },
    });
  });
});

describe("airport and station draft bodies (create-booking doc)", () => {
  const details = {
    startDate: new Date(2026, 10, 10),
    endDate: new Date(2026, 10, 12),
    time: "09",
    days: 2,
    pricePerDay: 90,
    subtotal: 180,
    vat: 0,
    total: 180,
    notes: "",
    pickupLocation: null,
    dropoffLocation: null,
  };
  const branchReturn = {
    lat: 30.04,
    lng: 31.23,
    region: "Cairo",
    address: "Branch street",
  };
  const base = { carId: "1", branchId: "3", details };
  const body = (request: CreateDraftRequest) =>
    Object.fromEntries(toCreateDraftFormData(request).entries());
  const common = {
    car_id: "1",
    branch_id: "3",
    from_day: "2026-11-10",
    to_day: "2026-11-12",
    time: "09",
  };

  it("airport with a branch there: delivery_to_airport=1, no delivery_type or delivery_*", () => {
    expect(
      body({
        ...base,
        bookingType: "airport",
        airportId: "2",
        returnAtPickupPoint: true,
        returnLocation: branchReturn,
      }),
    ).toEqual({
      ...common,
      type: "airport",
      airport_id: "2",
      delivery_to_airport: "1",
    });
  });

  it("airport without a branch there: delivery_to_airport=0 with the return location", () => {
    expect(
      body({
        ...base,
        bookingType: "airport",
        airportId: "2",
        returnAtPickupPoint: false,
        returnLocation: branchReturn,
      }),
    ).toEqual({
      ...common,
      type: "airport",
      airport_id: "2",
      delivery_to_airport: "0",
      delivery_lat: "30.04",
      delivery_long: "31.23",
      delivery_region: "Cairo",
      delivery_address: "Branch street",
    });
  });

  it("station always sends delivery_* (backend known issue)", () => {
    expect(
      body({
        ...base,
        bookingType: "station",
        stationId: "5",
        returnAtPickupPoint: true,
        returnLocation: branchReturn,
      }),
    ).toMatchObject({
      type: "station",
      train_station_id: "5",
      delivery_to_station: "1",
      delivery_lat: "30.04",
      delivery_address: "Branch street",
    });
  });

  it("E1 for airport sends its own type and no delivery_type", async () => {
    get.mockResolvedValue(availabilityResponse);
    await bookingsApi.checkAvailability({
      carId: "1",
      branchId: "3",
      type: "airport",
      fromDay: "2026-11-10",
      toDay: "2026-11-12",
    });
    expect(get).toHaveBeenLastCalledWith("/booking/is-available-days", {
      query: {
        car_id: 1,
        branch_id: 3,
        type: "airport",
        from_day: "2026-11-10",
        to_day: "2026-11-12",
      },
    });
  });
});
