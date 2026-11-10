import { describe, expect, it } from "vitest";
import {
  carSupportsRentalContext,
  readRentalContext,
  rentalContextParams,
} from "./model";

const location = { lat: "30.5", lng: "31.0", region: "Monufia" };
const read = (values: Record<string, string>) =>
  readRentalContext(new URLSearchParams(values));

const availability = {
  bookingTypes: {
    daily: true,
    monthly: false,
    airport: true,
    station: true,
    international: true,
  },
  deliveryTypes: { toLocation: false, fromBranch: true },
};

describe("readRentalContext", () => {
  it("reads a finished daily flow and rebuilds the same params", () => {
    const context = read({
      type: "daily",
      deliveryType: "from_branch",
      ...location,
    });
    expect(context).toEqual({
      type: "daily",
      deliveryType: "from_branch",
      ...location,
    });
    expect(rentalContextParams(context!).toString()).toBe(
      "type=daily&deliveryType=from_branch&lat=30.5&lng=31.0&region=Monufia",
    );
  });

  it("requires each type's own choice", () => {
    expect(read({ type: "daily", ...location })).toBeNull();
    expect(read({ type: "airport", ...location })).toBeNull();
    expect(read({ type: "station", ...location })).toBeNull();
    expect(
      read({ type: "international", deliveryType: "to_location", ...location }),
    ).toBeNull();
    expect(read({ type: "airport", airportId: "4", ...location })).toEqual({
      type: "airport",
      airportId: "4",
      ...location,
    });
  });

  it("requires a complete location and a known type", () => {
    expect(
      read({
        type: "daily",
        deliveryType: "from_branch",
        lat: "30.5",
        lng: "31",
      }),
    ).toBeNull();
    expect(
      read({
        type: "daily",
        deliveryType: "from_branch",
        ...location,
        lat: "x",
      }),
    ).toBeNull();
    expect(
      read({ type: "weekly", deliveryType: "from_branch", ...location }),
    ).toBeNull();
    // A listing opened without the flow (filters only).
    expect(read({ q: "toyota" })).toBeNull();
  });
});

describe("carSupportsRentalContext", () => {
  it("checks the booking type and the delivery type", () => {
    const daily = read({
      type: "daily",
      deliveryType: "from_branch",
      ...location,
    })!;
    expect(carSupportsRentalContext(availability, daily)).toBe(true);
    expect(
      carSupportsRentalContext(
        availability,
        read({ type: "daily", deliveryType: "to_location", ...location })!,
      ),
    ).toBe(false);
    expect(
      carSupportsRentalContext(
        availability,
        read({ type: "monthly", deliveryType: "from_branch", ...location })!,
      ),
    ).toBe(false);
  });
});
