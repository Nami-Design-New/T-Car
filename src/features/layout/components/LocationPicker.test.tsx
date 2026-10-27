import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  readGuestLocation,
  saveGuestLocationRecord,
} from "@/shared/lib/guest-location";
import type { LocationData } from "@/shared/lib/location";
import { renderWithIntl } from "@/shared/test/render";
import LocationPicker from "./LocationPicker";

const picked: LocationData = {
  lat: 21.54,
  lng: 39.17,
  address: "Al Hamra, Jeddah",
  region: "Makkah Province",
};

// The map needs Google Maps; a stub confirms a fixed pick.
vi.mock("next/dynamic", () => ({
  default: () =>
    function MapStub({ onConfirm }: { onConfirm: (l: LocationData) => void }) {
      return (
        <button type="button" onClick={() => onConfirm(picked)}>
          Confirm pick
        </button>
      );
    },
}));

const save = (address?: string) =>
  saveGuestLocationRecord({
    status: "granted",
    lat: 24.71,
    lng: 46.67,
    address,
    region: address && "Riyadh Province",
    savedAt: "2026-10-27T00:00:00.000Z",
  });

const choose = () =>
  screen.getByRole("button", { name: "Choose your location" });

beforeEach(() => {
  window.localStorage.clear();
});

describe("LocationPicker", () => {
  it("shows a guest's stored address", () => {
    save("Alsahafa, Riyadh");
    renderWithIntl(<LocationPicker guest />);

    expect(choose()).toHaveTextContent("Alsahafa, Riyadh");
  });

  it("shows the address once the lookup stores it", () => {
    save();
    renderWithIntl(<LocationPicker guest />);
    expect(choose()).toHaveTextContent("Riyadh, Al Hurriya Street");

    act(() => save("Alsahafa, Riyadh"));
    expect(choose()).toHaveTextContent("Alsahafa, Riyadh");
  });

  it("stores the place a guest picks on the map", async () => {
    const user = userEvent.setup();
    renderWithIntl(<LocationPicker guest />);

    await user.click(choose());
    await user.click(screen.getByRole("button", { name: "Confirm pick" }));

    expect(choose()).toHaveTextContent("Al Hamra, Jeddah");
    expect(readGuestLocation()).toEqual(picked);
  });

  it("ignores the guest location for a session", async () => {
    const user = userEvent.setup();
    save("Alsahafa, Riyadh");
    renderWithIntl(<LocationPicker />);
    expect(choose()).toHaveTextContent("Riyadh, Al Hurriya Street");

    await user.click(choose());
    await user.click(screen.getByRole("button", { name: "Confirm pick" }));
    expect(readGuestLocation()?.address).toBe("Alsahafa, Riyadh");
  });
});
