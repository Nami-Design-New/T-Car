import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Airport, Country, Station } from "../model";
import { useRentalFlow } from "./useRentalFlow";

const location = {
  lat: 24.7,
  lng: 46.6,
  address: "Riyadh",
  region: "Riyadh Region",
};

function setup() {
  window.localStorage.setItem(
    "tcar.guestLocation",
    JSON.stringify({ status: "granted", savedAt: "2026-11-10", ...location }),
  );
  const onComplete = vi.fn<(params: URLSearchParams) => void>();
  const { result } = renderHook(() => useRentalFlow({ onComplete }));
  const completedWith = () =>
    Object.fromEntries(onComplete.mock.lastCall![0].entries());
  return { result, onComplete, completedWith };
}

describe("useRentalFlow", () => {
  it("starts closed", () => {
    const { result } = setup();
    expect(result.current.step).toBeNull();
    expect(result.current.rentalType).toBeNull();
  });

  it.each([
    ["daily", "pickup"],
    ["monthly", "pickup"],
    ["international", "country"],
    ["airport", "airport"],
    ["station", "station"],
  ] as const)("opens %s at the %s step", (type, step) => {
    const { result } = setup();
    act(() => result.current.start(type));
    expect(result.current.rentalType).toBe(type);
    expect(result.current.step).toBe(step);
  });

  it("goes daily → pickup → map → /cars with the location", () => {
    const { result, completedWith } = setup();
    act(() => result.current.start("daily"));
    act(() => result.current.confirmPickup());
    expect(result.current.step).toBe("map");
    act(() => result.current.confirmLocation(location));
    expect(result.current.step).toBeNull();
    expect(completedWith()).toEqual({
      type: "daily",
      lat: "24.7",
      lng: "46.6",
      region: "Riyadh Region",
    });
  });

  it("uses the saved location after the airport selection", () => {
    const { result, completedWith } = setup();
    act(() => result.current.start("airport"));
    act(() => result.current.confirmAirport({ id: 7 } as Airport));
    expect(result.current.step).toBeNull();
    expect(completedWith()).toEqual({
      type: "airport",
      airportId: "7",
      lat: "24.7",
      lng: "46.6",
      region: "Riyadh Region",
    });
  });

  it("omits location when it is not saved", () => {
    const { result, completedWith } = setup();
    window.localStorage.clear();
    act(() => result.current.start("airport"));
    act(() => result.current.confirmAirport({ id: 7 } as Airport));

    expect(completedWith()).toEqual({ type: "airport", airportId: "7" });
  });

  it("does not complete without a region", () => {
    const { result, onComplete } = setup();
    act(() => result.current.start("daily"));
    act(() => result.current.confirmPickup());
    act(() => result.current.confirmLocation({ ...location, region: undefined }));

    expect(result.current.step).toBe("map");
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("uses the saved location after the station selection", () => {
    const { result, completedWith } = setup();
    act(() => result.current.start("station"));
    act(() => result.current.confirmStation({ id: 3 } as Station));
    expect(result.current.step).toBeNull();
    expect(completedWith()).toEqual({
      type: "station",
      stationId: "3",
      lat: "24.7",
      lng: "46.6",
      region: "Riyadh Region",
    });
  });

  it("asks for the pickup type after the country", () => {
    const { result, completedWith } = setup();
    act(() => result.current.start("international"));
    act(() => result.current.confirmCountry({ id: 5 } as Country));
    expect(result.current.step).toBe("pickup");
    act(() => result.current.confirmPickup());
    act(() => result.current.confirmLocation(location));
    expect(completedWith()).toMatchObject({
      type: "international",
      countryId: "5",
    });
  });

  it("drops earlier choices when a new type is started", () => {
    const { result, completedWith } = setup();
    act(() => result.current.start("airport"));
    act(() => result.current.confirmAirport({ id: 7 } as Airport));
    act(() => result.current.start("daily"));
    act(() => result.current.confirmPickup());
    act(() => result.current.confirmLocation(location));
    expect(completedWith()).not.toHaveProperty("airportId");
  });

  it("closes without navigating", () => {
    const { result, onComplete } = setup();
    act(() => result.current.start("daily"));
    act(() => result.current.close());
    expect(result.current.step).toBeNull();
    expect(onComplete).not.toHaveBeenCalled();
  });
});
