import { afterEach, describe, expect, it } from "vitest";
import { GUEST_LOCATION_KEY } from "@/shared/lib/guest-location";
import { allowedAreaOf, mapStartLocation } from "./bookingMap";

const branch = {
  id: "3",
  name: "cairo",
  address: "Branch street",
  distanceKm: 8,
  latitude: 30.04,
  longitude: 31.23,
};

afterEach(() => window.localStorage.clear());

describe("allowedAreaOf", () => {
  it("draws the allowed distance around the branch", () => {
    expect(allowedAreaOf(branch, 60)).toEqual({
      center: { lat: 30.04, lng: 31.23 },
      radiusKm: 60,
    });
  });

  it("draws nothing without a distance or branch coordinates", () => {
    expect(allowedAreaOf(branch, undefined)).toBeUndefined();
    expect(allowedAreaOf(branch, 0)).toBeUndefined();
    expect(
      allowedAreaOf({ ...branch, latitude: undefined }, 60),
    ).toBeUndefined();
  });
});

describe("mapStartLocation", () => {
  it("keeps the chosen point", () => {
    const chosen = { lat: 1, lng: 2, address: "Chosen" };
    expect(mapStartLocation(chosen)).toBe(chosen);
  });

  it("falls back to the saved browser location", () => {
    window.localStorage.setItem(
      GUEST_LOCATION_KEY,
      JSON.stringify({
        status: "granted",
        savedAt: "2026-11-10T00:00:00Z",
        lat: 30.5,
        lng: 31,
        region: "Monufia",
      }),
    );
    expect(mapStartLocation(null)).toEqual({
      lat: 30.5,
      lng: 31,
      region: "Monufia",
      address: "",
    });
  });

  it("is null with neither", () => {
    expect(mapStartLocation(null)).toBeNull();
  });
});
