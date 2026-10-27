import { waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  GUEST_LOCATION_KEY,
  readGuestLocation,
  readGuestLocationRecord,
  saveGuestLocationRecord,
} from "@/shared/lib/guest-location";
import { renderWithIntl } from "@/shared/test/render";
import GuestLocationRequest from "./GuestLocationRequest";

const getCurrentPosition = vi.fn();
const fetchMock = vi.fn();

const positionError = (code: number) =>
  ({
    code,
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3,
  }) as GeolocationPositionError;

const allow = (latitude: number, longitude: number) =>
  getCurrentPosition.mockImplementation((success: PositionCallback) =>
    success({ coords: { latitude, longitude } } as GeolocationPosition),
  );

const reject = (code: number) =>
  getCurrentPosition.mockImplementation(
    (_: PositionCallback, error: PositionErrorCallback) =>
      error(positionError(code)),
  );

const geocoded = {
  status: "OK",
  results: [
    {
      formatted_address: "Alsahafa, Riyadh 12251, Saudi Arabia",
      address_components: [
        { long_name: "Riyadh", types: ["locality"] },
        {
          long_name: "Riyadh Province",
          types: ["administrative_area_level_1", "political"],
        },
      ],
    },
  ],
};

const respond = (body: unknown) =>
  fetchMock.mockResolvedValue({ ok: true, json: async () => body });

beforeEach(() => {
  window.localStorage.clear();
  getCurrentPosition.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: { getCurrentPosition },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("GuestLocationRequest", () => {
  it("stores the coordinates, address and region when the guest allows access", async () => {
    allow(24.71, 46.67);
    respond(geocoded);
    renderWithIntl(<GuestLocationRequest />);

    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(readGuestLocation()).toEqual({
        lat: 24.71,
        lng: 46.67,
        address: "Alsahafa, Riyadh 12251, Saudi Arabia",
        region: "Riyadh Province",
      }),
    );
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.searchParams.get("latlng")).toBe("24.71,46.67");
    expect(url.searchParams.get("language")).toBe("en");
  });

  it("keeps the coordinates when the lookup fails, and looks up again next visit", async () => {
    allow(24.71, 46.67);
    respond({ status: "REQUEST_DENIED", results: [] });
    renderWithIntl(<GuestLocationRequest />).unmount();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(readGuestLocation()).toEqual({ lat: 24.71, lng: 46.67 });

    respond(geocoded);
    renderWithIntl(<GuestLocationRequest />);
    await waitFor(() =>
      expect(readGuestLocation()?.region).toBe("Riyadh Province"),
    );
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
  });

  it("does not ask or look up again once the location is complete", () => {
    saveGuestLocationRecord({
      status: "granted",
      lat: 1,
      lng: 2,
      address: "Somewhere",
      savedAt: "2026-10-27T00:00:00.000Z",
    });
    renderWithIntl(<GuestLocationRequest />);

    expect(getCurrentPosition).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("remembers a rejection and does not ask again", () => {
    reject(1);
    renderWithIntl(<GuestLocationRequest />).unmount();
    renderWithIntl(<GuestLocationRequest />);

    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
    expect(readGuestLocationRecord()?.status).toBe("denied");
    expect(readGuestLocation()).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("asks again next visit after a timeout", () => {
    reject(3);
    renderWithIntl(<GuestLocationRequest />);

    expect(readGuestLocationRecord()).toBeNull();
  });

  it("ignores a stored value it cannot read", () => {
    window.localStorage.setItem(
      GUEST_LOCATION_KEY,
      '{"status":"granted","lat":200}',
    );
    expect(readGuestLocationRecord()).toBeNull();
    window.localStorage.setItem(GUEST_LOCATION_KEY, "not json");
    expect(readGuestLocationRecord()).toBeNull();
  });

  it("does nothing when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    allow(1, 2);
    respond(geocoded);

    expect(() => renderWithIntl(<GuestLocationRequest />)).not.toThrow();
    expect(readGuestLocation()).toBeNull();
  });
});
