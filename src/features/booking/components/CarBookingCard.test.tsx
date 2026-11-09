import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/shared/test/render";
import CarBookingCard from "./CarBookingCard";

vi.mock("../hooks/useCreateBooking", () => ({
  useCreateBooking: () => ({ submitting: false, createBooking: vi.fn() }),
}));

describe("CarBookingCard", () => {
  it("disables booking and asks for a location without complete rental context", () => {
    renderWithIntl(
      <CarBookingCard
        carId="1"
        carName="Avalon"
        carBrand="Toyota"
        carYear={2026}
        carImage="/car.jpg"
        showroom="T-Car"
        rating={4.5}
        lowerPrice={90}
        maxPrice={120}
        bookingContext={{
          bookingType: "daily",
          deliveryType: "from_branch",
          branch: {
            id: "3",
            name: "Riyadh branch",
            address: "Riyadh",
            distanceKm: 1,
          },
        }}
      />,
    );

    expect(screen.getByRole("button", { name: "Book now" })).toBeDisabled();
    expect(
      screen.getByText("Choose a location to book this car."),
    ).toBeInTheDocument();
  });
});
