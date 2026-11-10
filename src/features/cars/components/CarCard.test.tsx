import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { GUEST_LOCATION_KEY } from "@/shared/lib/guest-location";
import { renderWithIntl } from "@/shared/test/render";
import type { CarListing } from "../model";
import CarCard from "./CarCard";

const routerPush = vi.hoisted(() => vi.fn());

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  useRouter: () => ({ push: routerPush }),
}));

const car: CarListing = {
  id: "3",
  name: "Avalon",
  brand: "BMW",
  image: "/images/placeholders/image-fallback.svg",
  pricePerDay: 434,
  rating: 0,
  year: 2026,
  showroom: "Kiayada Company",
};

describe("CarCard offer badge", () => {
  it("shows a free-days offer with its numbers", () => {
    renderWithIntl(
      <CarCard car={{ ...car, offer: { requiredDays: 5, freeDays: 1 } }} />,
    );
    expect(screen.getByText("Book 5 days and get")).toBeInTheDocument();
    expect(screen.getByText("a free day")).toBeInTheDocument();
    expect(screen.getByText("extra day")).toBeInTheDocument();
  });

  it("does not infer an offer badge from an original price alone", () => {
    renderWithIntl(
      <CarCard car={{ ...car, pricePerDay: 75, originalPrice: 100 }} />,
    );
    expect(screen.queryByText("25%")).not.toBeInTheDocument();
    expect(screen.queryByText("off")).not.toBeInTheDocument();
  });

  it("shows no badge for a car without an offer or discount", () => {
    renderWithIntl(<CarCard car={car} />);
    expect(screen.queryByText("Save when you book now")).not.toBeInTheDocument();
    expect(screen.queryByText(/free day/)).not.toBeInTheDocument();
  });
});

describe("CarCard airport pickup badge", () => {
  it("shows for an airport-flow listing car with airport pickup", () => {
    renderWithIntl(
      <CarCard
        car={{ ...car, pickupPoint: "airport" }}
        showAirportPickup
      />,
    );

    expect(screen.getByText("Airport pickup")).toBeInTheDocument();
  });

  it("does not show outside the airport flow", () => {
    renderWithIntl(<CarCard car={{ ...car, pickupPoint: "airport" }} />);

    expect(screen.queryByText("Airport pickup")).not.toBeInTheDocument();
  });
});

describe("CarCard details navigation", () => {
  it("carries the saved region into the details URL", async () => {
    window.localStorage.setItem(
      GUEST_LOCATION_KEY,
      JSON.stringify({
        status: "granted",
        lat: 24.7136,
        lng: 46.6753,
        region: "Riyadh Region",
        savedAt: "2026-11-05T00:00:00.000Z",
      }),
    );
    const user = userEvent.setup();
    renderWithIntl(<CarCard car={car} />);

    await user.click(screen.getByRole("link"));

    expect(routerPush).toHaveBeenCalledWith(
      "/cars/3?region=Riyadh+Region&lat=24.7136&lng=46.6753",
    );
  });
});
