import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  readCurrentLocation,
  useLocationSourceStore,
} from "@/features/location";
import {
  readGuestLocation,
  saveGuestLocationRecord,
} from "@/shared/lib/guest-location";
import type { LocationData } from "@/shared/lib/location";
import { renderWithIntl } from "@/shared/test/render";
import LocationPicker from "./LocationPicker";

const { assignLocationAction, refresh, success, error } = vi.hoisted(() => ({
  assignLocationAction: vi.fn(),
  refresh: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("@/features/auth", () => ({ assignLocationAction }));
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ refresh, replace: vi.fn() }),
}));
vi.mock("@/shared/hooks/useNotify", () => ({
  useNotify: () => ({ success, error }),
}));

const picked: LocationData = {
  lat: 21.54,
  lng: 39.17,
  address: "Al Hamra, Jeddah",
  region: "منطقة مكة المكرمة",
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
  vi.clearAllMocks();
});

afterEach(() => useLocationSourceStore.setState({ source: { kind: "guest" } }));

const signIn = (location: LocationData | null) =>
  useLocationSourceStore.setState({ source: { kind: "user", location } });

describe("LocationPicker", () => {
  it("shows a guest's stored address", () => {
    save("Alsahafa, Riyadh");
    renderWithIntl(<LocationPicker signedIn={false} />);

    expect(choose()).toHaveTextContent("Alsahafa, Riyadh");
  });

  it("shows the address once the lookup stores it", () => {
    save();
    renderWithIntl(<LocationPicker signedIn={false} />);
    expect(choose()).toHaveTextContent("Riyadh, Al Hurriya Street");

    act(() => save("Alsahafa, Riyadh"));
    expect(choose()).toHaveTextContent("Alsahafa, Riyadh");
  });

  it("stores the place a guest picks on the map", async () => {
    const user = userEvent.setup();
    renderWithIntl(<LocationPicker signedIn={false} />);

    await user.click(choose());
    await user.click(screen.getByRole("button", { name: "Confirm pick" }));

    expect(choose()).toHaveTextContent("Al Hamra, Jeddah");
    expect(readGuestLocation()).toEqual(picked);
  });

  it("uses and replaces the saved location", async () => {
    const user = userEvent.setup();
    save("Alsahafa, Riyadh");
    renderWithIntl(<LocationPicker signedIn={false} />);
    expect(choose()).toHaveTextContent("Alsahafa, Riyadh");

    await user.click(choose());
    await user.click(screen.getByRole("button", { name: "Confirm pick" }));
    expect(readGuestLocation()).toEqual(picked);
  });
});

describe("LocationPicker for a signed-in customer", () => {
  const riyadh: LocationData = {
    lat: 24.7136,
    lng: 46.6753,
    address: "Alsahafa, Riyadh",
    region: "منطقة الرياض",
  };

  it("shows the account's location, not the browser's", () => {
    save("Browser street");
    signIn(riyadh);
    renderWithIntl(<LocationPicker signedIn />);

    expect(choose()).toHaveTextContent("Alsahafa, Riyadh");
  });

  it("asks for a location when the account has none", () => {
    save("Browser street");
    signIn(null);
    renderWithIntl(<LocationPicker signedIn />);

    expect(choose()).toHaveTextContent("Choose your location");
  });

  it("saves a pick to the account and leaves the browser location alone", async () => {
    const user = userEvent.setup();
    save("Browser street");
    signIn(riyadh);
    assignLocationAction.mockResolvedValue({
      ok: true,
      data: { onboardingStep: "completed" },
      message: "Location saved successfully.",
    });
    renderWithIntl(<LocationPicker signedIn />);

    await user.click(choose());
    await user.click(screen.getByRole("button", { name: "Confirm pick" }));

    // The Arabic region is sent as the map gave it.
    expect(assignLocationAction).toHaveBeenCalledWith(picked);
    expect(readCurrentLocation()).toEqual(picked);
    expect(readGuestLocation()?.address).toBe("Browser street");
    expect(choose()).toHaveTextContent("Al Hamra, Jeddah");
    expect(success).toHaveBeenCalledWith("Location saved successfully.");
    expect(refresh).toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: "Confirm pick" }),
    ).not.toBeInTheDocument();
  });

  it("keeps the map open and the location unchanged when the save fails", async () => {
    const user = userEvent.setup();
    signIn(riyadh);
    assignLocationAction.mockResolvedValue({
      ok: false,
      error: {
        kind: "validation",
        serverMessage: "The region field is required.",
      },
    });
    renderWithIntl(<LocationPicker signedIn />);

    await user.click(choose());
    await user.click(screen.getByRole("button", { name: "Confirm pick" }));

    expect(error).toHaveBeenCalledWith("The region field is required.");
    expect(readCurrentLocation()).toEqual(riyadh);
    expect(refresh).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Confirm pick" }),
    ).toBeInTheDocument();
  });
});
