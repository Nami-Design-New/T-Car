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
  details: {
    power: "160 HP",
    door_count: 4,
    has_navigation: true,
    has_bluetooth: true,
    has_panorama: false,
    has_usp: true,
    has_background_camera: true,
    has_sensors: true,
    has_apple_play: true,
  },
  has_offer: true,
  offer: { type: "free_days", require_booking_days: 5, free_days: 1 },
};

const details = {
  car,
  serevices: [
    { id: 1, price: 50, title: "Additional driver", key: "adding_driver" },
    { id: 2, price: 75, title: "Travel abroad", key: "travel_abroad" },
    { id: 3, price: 0, title: "Insurance cover", key: null },
  ],
  insurance: {
    id: 1,
    title: "Full insurance",
    description: "Covers accidental damage.",
    requires_percentage: true,
    percentage: 15,
  },
  warranties: [
    {
      title: "On-time arrival",
      content:
        "<p>Arrives on time &amp; ready to drive.</p><script>alert(1)</script>",
    },
  ],
};

const envelope = (data: unknown) => ({
  data,
  message: "Fetched successfully.",
  code: 200,
});

const companyRatings = {
  summary: { average: 3.4, count: 2, label: "Good" },
  rates: [
    {
      id: 10,
      value: 4,
      user_name: "Saad Alnajjar",
      created_at: "2025-12-25 10:30:00",
      order: { order_number: "ignored" },
    },
  ],
};

const policies = {
  client_instructions: [
    {
      id: 1,
      content:
        "<ol><li>Report incidents immediately.</li><li>Return on time.</li></ol>",
    },
  ],
  cancellation_policies: [
    { id: 2, content: "<p>Cancellation is subject to the booking terms.</p>" },
  ],
};

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
    get.mockResolvedValue(envelope(details));

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
    ).resolves.toEqual(mapCarDetails(details));

    expect(get).toHaveBeenCalledWith(
      "/cars/3?region=Riyadh+Region&latitude=24.7136&longitude=46.6753&delivery_type=to_location&booking_type=airport&airport_id=12",
    );
  });

  it("rejects malformed success data as a server error", async () => {
    get.mockResolvedValue(envelope({ ...details, car: { id: 3 } }));

    await expect(carDetailsApi.getCarDetails("3", {})).rejects.toMatchObject({
      kind: "server",
    });
  });

  it("maps technical quick facts, warranties, services, and insurance safely", () => {
    expect(mapCarDetails(details)).toMatchObject({
      quickFacts: [
        { kind: "power", value: "160 HP" },
        { kind: "doors", value: "4" },
        { kind: "navigation" },
        { kind: "bluetooth" },
        { kind: "usb" },
        { kind: "camera" },
        { kind: "sensors" },
        { kind: "applePlay" },
      ],
      warranties: [
        {
          id: "warranty-0",
          title: "On-time arrival",
          description: "Arrives on time & ready to drive.",
        },
      ],
      addons: [
        { id: "1", icon: "driver" },
        { id: "2", icon: "travel" },
        { id: "3", icon: "shield" },
      ],
      insuranceOptions: [
        {
          id: "1",
          title: "Full insurance",
          description: "Covers accidental damage.",
          percentage: 15,
        },
      ],
    });
  });

  it("keeps backend validation errors intact", async () => {
    const validation = new AppError("validation", undefined, 422, undefined, {
      serverMessage: "The latitude field is required.",
    });
    get.mockRejectedValue(validation);

    await expect(carDetailsApi.getCarDetails("3", {})).rejects.toBe(validation);
  });

  it("maps company ratings without exposing order metadata", async () => {
    get.mockResolvedValue(envelope(companyRatings));

    await expect(
      carDetailsApi.getCompanyRatings("3", {
        location: {
          region: "Riyadh Region",
          latitude: 24.7136,
          longitude: 46.6753,
        },
        deliveryType: "to_location",
      }),
    ).resolves.toEqual({
      average: 3.4,
      count: 2,
      reviews: [
        {
          id: "10",
          name: "Saad Alnajjar",
          rating: 4,
          date: "2025-12-25 10:30:00",
        },
      ],
    });

    expect(get).toHaveBeenCalledWith(
      "/cars/3/company-rates?latitude=24.7136&longitude=46.6753&delivery_type=to_location",
    );
  });

  it("maps policy HTML to safe tab content", async () => {
    get.mockResolvedValue(envelope(policies));

    await expect(carDetailsApi.getPolicies()).resolves.toEqual({
      clientInstructions: ["Report incidents immediately.", "Return on time."],
      cancellationPolicies: ["Cancellation is subject to the booking terms."],
    });
    expect(get).toHaveBeenCalledWith("/policies");
  });
});
