import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/shared/lib/errors";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/services/http/server", () => ({
  publicServerHttp: { get },
}));

import { carDetailsApi, mapCarDetails } from "./api";
import { parseCarDetailsQuery } from "./model";

beforeEach(() => vi.clearAllMocks());

const car = {
  id: 3,
  image_url: "https://t-car.app/storage/cars/car-3.png",
  year: 2026,
  company_name: "Kiayada Company",
  company_logo: "https://t-car.app/storage/companies/logos/kiayada.png",
  lower_price: 434,
  max_price: 444,
  rate: 4.5,
  brand: { id: 9, title: "BMW", logo: null },
  car_model: { id: 8, title: "Avalon", logo: null },
  has_offer: true,
  offer: { type: "free_days", require_booking_days: 5, free_days: 1 },
};

const envelope = (data: unknown) => ({
  data,
  message: "Fetched successfully.",
  code: 200,
});

describe("parseCarDetailsQuery", () => {
  it("sends the complete saved location and selected booking context", () => {
    expect(
      parseCarDetailsQuery({
        region: "Riyadh Region",
        lat: "24.7136",
        lng: "46.6753",
        deliveryType: "to_location",
        type: "airport",
        airportId: "12",
      }),
    ).toEqual({
      location: {
        region: "Riyadh Region",
        latitude: 24.7136,
        longitude: 46.6753,
      },
      deliveryType: "to_location",
      bookingType: "airport",
      airportId: "12",
    });
  });

  it("omits an incomplete or invalid location tuple", () => {
    expect(
      parseCarDetailsQuery({ region: "Riyadh", lat: "999", lng: "46" }),
    ).toEqual({});
    expect(
      parseCarDetailsQuery({ region: "Riyadh", lat: "", lng: "46" }),
    ).toEqual({});
  });
});

describe("carDetailsApi.getCarDetails", () => {
  it("maps core fields and sends selected context under backend names", async () => {
    get.mockResolvedValue(envelope({ car }));

    await expect(
      carDetailsApi.getCarDetails("3", {
        location: {
          region: "Riyadh Region",
          latitude: 24.7136,
          longitude: 46.6753,
        },
        deliveryType: "to_location",
        bookingType: "airport",
        airportId: "12",
      }),
    ).resolves.toEqual(mapCarDetails(car));

    expect(get).toHaveBeenCalledWith(
      "/cars/3?region=Riyadh+Region&latitude=24.7136&longitude=46.6753&delivery_type=to_location&booking_type=airport&airport_id=12",
    );
  });

  it("rejects malformed success data as a server error", async () => {
    get.mockResolvedValue(envelope({ car: { id: 3 } }));

    await expect(carDetailsApi.getCarDetails("3", {})).rejects.toMatchObject({
      kind: "server",
    });
  });

  it("keeps backend validation errors intact", async () => {
    const validation = new AppError("validation", undefined, 422, undefined, {
      serverMessage: "The latitude field is required.",
    });
    get.mockRejectedValue(validation);

    await expect(carDetailsApi.getCarDetails("3", {})).rejects.toBe(validation);
  });
});
