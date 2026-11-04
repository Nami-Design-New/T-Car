import { beforeEach, describe, expect, it, vi } from "vitest";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/services/http/server", () => ({
  publicServerHttp: { get },
}));

import { rentalSearchApi } from "./api";

const pageOf = (data: unknown) => ({
  data,
  pagination: {
    current_page: 1,
    last_page: 1,
    per_page: 100,
    total: Array.isArray(data) ? data.length : 0,
    from: 1,
    to: Array.isArray(data) ? data.length : 0,
  },
  message: "Fetched successfully.",
  code: 200,
});

beforeEach(() => vi.clearAllMocks());

describe("rentalSearchApi.getOptions", () => {
  it("maps the live airport, station, and country DTOs", async () => {
    get
      .mockResolvedValueOnce(
        pageOf([
          {
            id: 2,
            title: "Prince Mohammad bin Abdulaziz International Airport",
            subtitle: null,
            city: { id: 4, title: "Madinah" },
          },
        ]),
      )
      .mockResolvedValueOnce(pageOf([{ id: 3, title: "Madinah Station" }]))
      .mockResolvedValueOnce(
        pageOf([
          {
            id: 1,
            title: "Saudi Arabia",
            phone_code: "+966",
            image: "https://t-car.app/storage/countries/sa.jpg",
          },
        ]),
      );

    await expect(rentalSearchApi.getOptions()).resolves.toEqual({
      airports: {
        items: [
          {
            id: 2,
            airport: "Prince Mohammad bin Abdulaziz International Airport",
            city: "Madinah",
          },
        ],
        page: 1,
        lastPage: 1,
        total: 1,
      },
      stations: {
        items: [{ id: 3, station: "Madinah Station" }],
        page: 1,
        lastPage: 1,
        total: 1,
      },
      countries: {
        items: [
          {
            id: 1,
            name: "Saudi Arabia",
            flag: "https://t-car.app/storage/countries/sa.jpg",
          },
        ],
        page: 1,
        lastPage: 1,
        total: 1,
      },
    });

    expect(get.mock.calls.map(([path]) => path)).toEqual([
      "/airports?page=1&per_page=20",
      "/train-stations?page=1&per_page=20",
      "/countries?page=1&per_page=20",
    ]);
  });

  it("rejects a malformed lookup response", async () => {
    get
      .mockResolvedValueOnce(pageOf([{ id: 2, title: "Airport" }]))
      .mockResolvedValueOnce(pageOf([]))
      .mockResolvedValueOnce(pageOf([]));

    await expect(rentalSearchApi.getOptions()).rejects.toMatchObject({
      kind: "server",
    });
  });

  it("sends the search and page parameters to the lookup endpoint", async () => {
    get.mockResolvedValueOnce(pageOf([]));

    await rentalSearchApi.listAirports({
      page: 2,
      perPage: 20,
      search: "Madinah",
      locale: "ar",
    });

    expect(get).toHaveBeenCalledWith(
      "/airports?page=2&per_page=20&search=Madinah",
      { headers: { "Accept-Language": "ar" } },
    );
  });
});
