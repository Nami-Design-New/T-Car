import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/shared/lib/errors";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/services/http/server", () => ({
  publicServerHttp: { get },
}));

import { cityCarsApi, isCompanyCarsGroup, mapCompanyCarsGroup } from "./api";

beforeEach(() => vi.clearAllMocks());

// Observed GET /city-cars group, 2026-11-03 (docs/api/cities-api.md §3.2).
const offerCar = {
  id: 3,
  image_url: "https://t-car.app/storage/cars/car-3.png",
  year: 2026,
  company_name: "Kiayada Company",
  company_logo: "https://t-car.app/storage/companies/logos/kiayada.png",
  any_car_branches_support_airport: false,
  lower_price: 434,
  max_price: 444,
  rate: 0,
  has_offer: true,
  brand: { id: 9, title: "BMW", logo: null },
  type: { id: 4, title: "Pickup", logo: null },
  car_model: { id: 8, title: "Avalon", logo: null },
  offer: {
    id: 4,
    description: "احجز 5 و وادفع 4",
    type: "free_days",
    require_booking_days: 5,
    free_days: 1,
    max_distance: 0,
  },
  availability: {
    booking_types: {
      daily: true,
      monthly: true,
      airport: false,
      station: false,
      international: false,
    },
    delivery_types: { to_location: true, from_branch: true },
  },
};

const plainCar = {
  ...offerCar,
  id: 47,
  image_url: null,
  company_logo: null,
  any_car_branches_support_airport: true,
  lower_price: 144,
  has_offer: false,
  offer: null,
};

const group = {
  company_id: 1,
  company_name: "Kiayada Company",
  company_logo: null,
  cars: [offerCar, plainCar],
};

describe("company car groups", () => {
  it("accepts the observed group and maps its office and cars", () => {
    expect(isCompanyCarsGroup(group)).toBe(true);
    expect(mapCompanyCarsGroup(group)).toEqual({
      office: {
        id: "1",
        slug: "1",
        name: "Kiayada Company",
        showroom: "Kiayada Company",
        logo: "/images/placeholders/image-fallback.svg",
      },
      cars: [
        {
          id: "3",
          name: "Avalon",
          brand: "BMW",
          image: "https://t-car.app/storage/cars/car-3.png",
          pricePerDay: 434,
          originalPrice: 444,
          rating: 0,
          year: 2026,
          showroom: "Kiayada Company",
          showroomLogo: "https://t-car.app/storage/companies/logos/kiayada.png",
          pickupPoint: undefined,
          offer: { requiredDays: 5, freeDays: 1 },
          availability: {
            bookingTypes: {
              daily: true,
              monthly: true,
              airport: false,
              station: false,
              international: false,
            },
            deliveryTypes: { toLocation: true, fromBranch: true },
          },
        },
        {
          id: "47",
          name: "Avalon",
          brand: "BMW",
          image: "/images/placeholders/image-fallback.svg",
          pricePerDay: 144,
          originalPrice: 444,
          rating: 0,
          year: 2026,
          showroom: "Kiayada Company",
          showroomLogo: undefined,
          pickupPoint: "airport",
          offer: undefined,
          availability: {
            bookingTypes: {
              daily: true,
              monthly: true,
              airport: false,
              station: false,
              international: false,
            },
            deliveryTypes: { toLocation: true, fromBranch: true },
          },
        },
      ],
    });
  });

  it("maps an offer of an unknown type to no offer", () => {
    const discount = {
      ...offerCar,
      offer: { ...offerCar.offer, type: "discount" },
    };
    const { cars } = mapCompanyCarsGroup({ ...group, cars: [discount] });
    expect(cars[0].offer).toBeUndefined();
  });

  it("uses one non-zero price without a strike-through price", () => {
    const { cars } = mapCompanyCarsGroup({
      ...group,
      cars: [{ ...plainCar, lower_price: 0, max_price: 200 }],
    });
    expect(cars[0]).toMatchObject({ pricePerDay: 200 });
    expect(cars[0].originalPrice).toBeUndefined();
  });

  it("rejects a group with a malformed car", () => {
    const { brand: _brand, ...withoutBrand } = plainCar;
    expect(isCompanyCarsGroup({ ...group, cars: [withoutBrand] })).toBe(false);
    expect(
      isCompanyCarsGroup({ ...group, cars: [{ ...plainCar, offer: {} }] }),
    ).toBe(false);
    expect(isCompanyCarsGroup({ ...group, company_id: "1" })).toBe(false);
  });
});

const pageOf = (data: unknown, current = 1, last = 1) => ({
  data,
  pagination: {
    current_page: current,
    last_page: last,
    per_page: 10,
    total: last,
    from: 1,
    to: 1,
  },
  message: "Fetched successfully.",
  code: 200,
});

const searchOf = (path: string) =>
  Object.fromEntries(new URL(path, "https://t-car.app/api/user/").searchParams);

describe("cityCarsApi.listCityCars", () => {
  it("sends the region, filters, date pair, and page in the locale", async () => {
    get.mockResolvedValue(pageOf([group], 2, 3));

    const page = await cityCarsApi.listCityCars(
      "ar",
      {
        region: "منطقة الرياض",
        query: "kia",
        minPrice: 100,
        maxPrice: 400,
        fromDay: "2026-11-10",
        toDay: "2026-11-12",
      },
      2,
    );

    expect(page).toEqual({
      items: [mapCompanyCarsGroup(group)],
      page: 2,
      lastPage: 3,
      total: 3,
    });
    const [path, init] = get.mock.calls[0];
    expect(init).toEqual({ headers: { "Accept-Language": "ar" } });
    expect(new URL(path, "https://t-car.app/api/user/").pathname).toBe(
      "/city-cars",
    );
    expect(searchOf(path)).toEqual({
      region: "منطقة الرياض",
      search: "kia",
      min_price: "100",
      max_price: "400",
      from_day: "2026-11-10",
      to_day: "2026-11-12",
      per_page: "1",
      page: "2",
    });
  });

  it("sends only the region, page size, and page without filters", async () => {
    get.mockResolvedValue(pageOf([]));

    await expect(
      cityCarsApi.listCityCars("en", { region: "مكة المكرمة" }, 1),
    ).resolves.toEqual({ items: [], page: 1, lastPage: 1, total: 1 });
    expect(searchOf(get.mock.calls[0][0])).toEqual({
      region: "مكة المكرمة",
      per_page: "1",
      page: "1",
    });
  });

  it("throws a server error for a malformed group or a missing pagination", async () => {
    get.mockResolvedValueOnce(pageOf([{ ...group, cars: [{}] }]));
    await expect(
      cityCarsApi.listCityCars("en", { region: "منطقة الرياض" }, 1),
    ).rejects.toMatchObject({ kind: "server" });

    get.mockResolvedValueOnce({ data: [group], message: "", code: 200 });
    await expect(
      cityCarsApi.listCityCars("en", { region: "منطقة الرياض" }, 1),
    ).rejects.toMatchObject({ kind: "server" });
  });

  it("propagates a backend validation error", async () => {
    const invalid = new AppError("validation", undefined, 422, undefined, {
      serverMessage:
        "The end date field is required when start date is present.",
    });
    get.mockRejectedValue(invalid);

    await expect(
      cityCarsApi.listCityCars("en", { region: "منطقة الرياض" }, 1),
    ).rejects.toBe(invalid);
  });
});

describe("cityCarsApi.listCompanyCars", () => {
  it("asks for the company's page with the same filters", async () => {
    get.mockResolvedValue(pageOf([offerCar], 2, 2));

    const page = await cityCarsApi.listCompanyCars(
      "en",
      "12",
      { region: "مكة المكرمة", query: "kia" },
      2,
    );

    expect(page.items).toEqual(mapCompanyCarsGroup(group).cars.slice(0, 1));
    expect(page).toMatchObject({ page: 2, lastPage: 2 });
    const [path] = get.mock.calls[0];
    expect(new URL(path, "https://t-car.app/api/user/").pathname).toBe(
      "/city-company-cars",
    );
    expect(searchOf(path)).toEqual({
      region: "مكة المكرمة",
      search: "kia",
      per_page: "10",
      page: "2",
      company_id: "12",
    });
  });

  it("throws a server error for a malformed car", async () => {
    get.mockResolvedValue(pageOf([{ id: 1 }]));

    await expect(
      cityCarsApi.listCompanyCars("en", "12", { region: "مكة المكرمة" }, 2),
    ).rejects.toMatchObject({ kind: "server" });
  });
});

describe("cityCarsApi.listHomeOfferCars", () => {
  it("sends the saved location and maps the offer cars", async () => {
    get.mockResolvedValue(pageOf([offerCar]));

    await expect(
      cityCarsApi.listHomeOfferCars("ar", 2, 1, {
        region: "منطقة عسير",
        latitude: 24.4673,
        longitude: 40.135,
      }),
    ).resolves.toEqual({
      items: [mapCompanyCarsGroup({ ...group, cars: [offerCar] }).cars[0]],
      page: 1,
      lastPage: 1,
      total: 1,
    });

    const [path, init] = get.mock.calls[0];
    expect(new URL(path, "https://t-car.app/api/user/").pathname).toBe(
      "/offer-cars",
    );
    expect(searchOf(path)).toEqual({
      region: "منطقة عسير",
      latitude: "24.4673",
      longitude: "40.135",
      per_page: "1",
      page: "2",
    });
    expect(init).toEqual({ headers: { "Accept-Language": "ar" } });
  });

  it("omits location parameters when none was saved", async () => {
    get.mockResolvedValue(pageOf([]));

    await cityCarsApi.listHomeOfferCars("en", 1, 1);

    expect(searchOf(get.mock.calls[0][0])).toEqual({
      per_page: "1",
      page: "1",
    });
  });

  it("rejects an offer-cars response with a malformed car", async () => {
    get.mockResolvedValue(pageOf([{ id: 3 }]));

    await expect(
      cityCarsApi.listHomeOfferCars("en", 1, 1),
    ).rejects.toMatchObject({ kind: "server" });
  });
});

describe("cityCarsApi.listHomeCarefullyChosenCars", () => {
  it("sends pagination and the saved location without a delivery type", async () => {
    get.mockResolvedValue(pageOf([offerCar]));

    await expect(
      cityCarsApi.listHomeCarefullyChosenCars("ar", 2, 10, {
        region: "منطقة المدينة",
        latitude: 18.2782333,
        longitude: 42.5035714,
      }),
    ).resolves.toEqual({
      items: [mapCompanyCarsGroup({ ...group, cars: [offerCar] }).cars[0]],
      page: 1,
      lastPage: 1,
      total: 1,
    });

    const [path, init] = get.mock.calls[0];
    expect(new URL(path, "https://t-car.app/api/user/").pathname).toBe(
      "/carfully-choises-cars",
    );
    expect(searchOf(path)).toEqual({
      region: "منطقة المدينة",
      latitude: "18.2782333",
      longitude: "42.5035714",
      per_page: "10",
      page: "2",
    });
    expect(init).toEqual({ headers: { "Accept-Language": "ar" } });
  });

  it("omits location parameters when none was saved", async () => {
    get.mockResolvedValue(pageOf([]));

    await cityCarsApi.listHomeCarefullyChosenCars("en", 1, 10);

    expect(searchOf(get.mock.calls[0][0])).toEqual({
      per_page: "10",
      page: "1",
    });
  });
});

describe("cityCarsApi cars-listing reads", () => {
  it("maps an offer company row and sends its source and saved location", async () => {
    get.mockResolvedValue(pageOf([group], 1, 2));

    await expect(
      cityCarsApi.listCarsListing(
        "ar",
        {
          source: "offer",
          region: "Madinah",
          latitude: 24.4673,
          longitude: 40.135,
          query: "kia",
        },
        1,
      ),
    ).resolves.toMatchObject({ items: [mapCompanyCarsGroup(group)], page: 1 });

    const [path] = get.mock.calls[0];
    expect(new URL(path, "https://t-car.app/api/user/").pathname).toBe(
      "/cars-listing",
    );
    expect(searchOf(path)).toEqual({
      per_page: "1",
      page: "1",
      region: "Madinah",
      latitude: "24.4673",
      longitude: "40.135",
      search: "kia",
      type: "offer",
    });
  });

  it("loads a company row from page two with its listing context", async () => {
    get.mockResolvedValue(pageOf([offerCar], 2, 3));

    await cityCarsApi.listListingCompanyCars(
      "en",
      "12",
      { source: "general", airportId: "2", brandIds: ["7"] },
      2,
    );

    const [path] = get.mock.calls[0];
    expect(new URL(path, "https://t-car.app/api/user/").pathname).toBe(
      "/company-cars",
    );
    expect(searchOf(path)).toEqual({
      per_page: "10",
      page: "2",
      "brand_id[0]": "7",
      company_id: "12",
      come_from: "general",
      airport_id: "2",
    });
  });
});
