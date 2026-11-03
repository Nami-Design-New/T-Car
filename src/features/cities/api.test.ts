import { beforeEach, describe, expect, it, vi } from "vitest";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/services/http/server", () => ({
  publicServerHttp: { get },
}));

import { citiesApi, isCityCompanyGroup, mapCityCompanyGroup } from "./api";

// Observed GET /cities records (docs/api/cities-api.md §3.1).
const riyadh = {
  id: 1,
  city_name: "Riyadh",
  city_image: "https://t-car.app/storage/lookups/cities/riyadh.png",
  region: "منطقة الرياض",
  cars_count: 51,
};

const page = (data: unknown) => ({
  data,
  pagination: {
    current_page: 1,
    last_page: 1,
    per_page: 100,
    total: 1,
    from: 1,
    to: 1,
  },
  message: "Fetched successfully.",
  code: 200,
});

beforeEach(() => vi.clearAllMocks());

describe("citiesApi.listCities", () => {
  it("reads one page of cities in the locale and maps the fields", async () => {
    get.mockResolvedValue(page([riyadh]));

    await expect(citiesApi.listCities("en")).resolves.toEqual([
      {
        id: "1",
        name: "Riyadh",
        region: "منطقة الرياض",
        image: "https://t-car.app/storage/lookups/cities/riyadh.png",
        carsAvailable: 51,
      },
    ]);
    expect(get).toHaveBeenCalledWith("/cities?per_page=100", {
      headers: { "Accept-Language": "en" },
    });
  });

  it("uses the fallback image for a city without one", async () => {
    get.mockResolvedValue(page([{ ...riyadh, city_image: null }]));

    const [city] = await citiesApi.listCities("ar");
    expect(city.image).toBe("/images/placeholders/image-fallback.svg");
  });

  it("throws a server error for a record without a region", async () => {
    const { region: _region, ...withoutRegion } = riyadh;
    get.mockResolvedValue(page([withoutRegion]));

    await expect(citiesApi.listCities("en")).rejects.toMatchObject({
      kind: "server",
    });
  });

  it("throws a server error for an answer that is not an envelope", async () => {
    get.mockResolvedValue("ok");

    await expect(citiesApi.listCities("en")).rejects.toMatchObject({
      kind: "server",
    });
  });
});

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

describe("city car groups", () => {
  it("accepts the observed group and maps its office and cars", () => {
    expect(isCityCompanyGroup(group)).toBe(true);
    expect(mapCityCompanyGroup(group)).toEqual({
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
          rating: 0,
          year: 2026,
          showroom: "Kiayada Company",
          showroomLogo: "https://t-car.app/storage/companies/logos/kiayada.png",
          pickupPoint: undefined,
          offer: { requiredDays: 5, freeDays: 1 },
        },
        {
          id: "47",
          name: "Avalon",
          brand: "BMW",
          image: "/images/placeholders/image-fallback.svg",
          pricePerDay: 144,
          rating: 0,
          year: 2026,
          showroom: "Kiayada Company",
          showroomLogo: undefined,
          pickupPoint: "airport",
          offer: undefined,
        },
      ],
    });
  });

  it("maps an offer of an unknown type to no offer", () => {
    const discount = { ...offerCar, offer: { ...offerCar.offer, type: "discount" } };
    const { cars } = mapCityCompanyGroup({ ...group, cars: [discount] });
    expect(cars[0].offer).toBeUndefined();
  });

  it("rejects a group with a malformed car", () => {
    const { brand: _brand, ...withoutBrand } = plainCar;
    expect(isCityCompanyGroup({ ...group, cars: [withoutBrand] })).toBe(false);
    expect(isCityCompanyGroup({ ...group, cars: [{ ...plainCar, offer: {} }] })).toBe(false);
    expect(isCityCompanyGroup({ ...group, company_id: "1" })).toBe(false);
  });
});
