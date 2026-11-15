import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { saveGuestLocationRecord } from "@/shared/lib/guest-location";
import type { SavedLocation } from "@/shared/lib/location";
import { UserLocationSync } from "./components/UserLocationSync";
import {
  readCurrentLocation,
  subscribeCurrentLocation,
  useLocationSourceStore,
} from "./currentLocation";

const browser: SavedLocation = {
  lat: 21.54,
  lng: 39.17,
  address: "الحمراء، جدة",
  region: "منطقة مكة المكرمة",
};

const saved: SavedLocation = {
  lat: 24.7136,
  lng: 46.6753,
  address: "حي الصحافة، الرياض",
  region: "منطقة الرياض",
};

const saveBrowser = (location: SavedLocation = browser) =>
  saveGuestLocationRecord({
    status: "granted",
    ...location,
    savedAt: "2026-11-15T00:00:00.000Z",
  });

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => useLocationSourceStore.setState({ source: { kind: "guest" } }));

describe("current location", () => {
  it("is the browser location for a guest", () => {
    saveBrowser();
    render(<UserLocationSync signedIn={false} location={null} />);

    expect(readCurrentLocation()).toEqual(browser);
  });

  it("is the customer's saved location when signed in, not the browser's", () => {
    saveBrowser();
    render(<UserLocationSync signedIn location={saved} />);

    expect(readCurrentLocation()).toEqual(saved);
  });

  it("is none for a signed-in customer without a saved location", () => {
    saveBrowser();
    render(<UserLocationSync signedIn location={null} />);

    expect(readCurrentLocation()).toBeNull();
  });

  it("returns to the browser location after sign-out", () => {
    saveBrowser();
    const { rerender } = render(<UserLocationSync signedIn location={saved} />);
    rerender(<UserLocationSync signedIn={false} location={null} />);

    expect(readCurrentLocation()).toEqual(browser);
  });

  it("notifies on sign-in and on a new saved location", () => {
    const onChange = vi.fn();
    const stop = subscribeCurrentLocation(onChange);
    const { rerender } = render(<UserLocationSync signedIn location={saved} />);
    expect(onChange).toHaveBeenCalledTimes(1);

    rerender(<UserLocationSync signedIn location={{ ...saved, lat: 24.8 }} />);
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(readCurrentLocation()?.lat).toBe(24.8);
    stop();
  });

  it("follows browser changes for a guest only", () => {
    const onChange = vi.fn();
    const stop = subscribeCurrentLocation(onChange);

    act(() => saveBrowser());
    expect(onChange).toHaveBeenCalledTimes(1);

    render(<UserLocationSync signedIn location={saved} />);
    onChange.mockClear();
    act(() => saveBrowser({ ...browser, lat: 21.6 }));
    expect(onChange).not.toHaveBeenCalled();
    expect(readCurrentLocation()).toEqual(saved);
    stop();
  });
});
