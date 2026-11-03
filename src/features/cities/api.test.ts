import { beforeEach, describe, expect, it, vi } from "vitest";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/services/http/server", () => ({
  publicServerHttp: { get },
}));

import { citiesApi } from "./api";

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
