import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/shared/lib/errors";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/services/http/server", () => ({ serverHttp: { get } }));

import { bookingsApi, mapOrdersResponse } from "./api";

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

function expectServerError(read: () => unknown) {
  try {
    read();
    throw new Error("Expected the response guard to throw");
  } catch (error) {
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).kind).toBe("server");
  }
}
