import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/shared/test/render";
import type { CarListing } from "../model";
import CarCard from "./CarCard";

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
    expect(screen.getByText("Book 5 days, get 1 day free")).toBeInTheDocument();
    expect(screen.getByText("free day")).toBeInTheDocument();
  });

  it("shows a discount percent for a car with an original price", () => {
    renderWithIntl(
      <CarCard car={{ ...car, pricePerDay: 75, originalPrice: 100 }} />,
    );
    expect(screen.getByText("25%")).toBeInTheDocument();
    expect(screen.getByText("off")).toBeInTheDocument();
  });

  it("shows no badge for a car without an offer or discount", () => {
    renderWithIntl(<CarCard car={car} />);
    expect(screen.queryByText("Limited-time offer")).not.toBeInTheDocument();
  });
});
