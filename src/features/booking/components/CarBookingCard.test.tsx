import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/shared/test/render";
import CarBookingCard from "./CarBookingCard";

vi.mock("../hooks/useCreateBooking", () => ({
  useCreateBooking: () => ({ submitting: false, createBooking: vi.fn() }),
}));
vi.mock("@/features/account", () => ({
  LazyLicenseUploadDialog: ({ open }: { open: boolean }) =>
    open ? <div role="dialog" aria-label="license upload" /> : null,
}));
vi.mock("../hooks/useCreateDraft", () => ({
  useCreateDraft: () => ({ submitting: false, createDraft: vi.fn() }),
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

  const bookableContext = {
    bookingType: "daily" as const,
    deliveryType: "from_branch" as const,
    location: { region: "Riyadh", latitude: 24.7, longitude: 46.7 },
    branch: { id: "3", name: "Riyadh branch", address: "Riyadh", distanceKm: 1 },
  };
  const renderCard = (
    props: Partial<React.ComponentProps<typeof CarBookingCard>> = {},
  ) =>
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
        bookingContext={bookableContext}
        {...props}
      />,
    );

  it("labels the price per month for a monthly rental", () => {
    renderCard({
      bookingContext: { ...bookableContext, bookingType: "monthly" },
    });
    expect(screen.getByText("/ month")).toBeInTheDocument();
    expect(screen.queryByText("/ day")).not.toBeInTheDocument();
  });

  it("asks for the driving license before booking when none is on file", () => {
    renderCard({ licenseUploaded: false });
    fireEvent.click(screen.getByRole("button", { name: "Book now" }));
    expect(
      screen.getByRole("dialog", { name: "license upload" }),
    ).toBeInTheDocument();
  });

  it("does not ask for the license when it is on file or unknown", () => {
    renderCard({ licenseUploaded: null });
    fireEvent.click(screen.getByRole("button", { name: "Book now" }));
    expect(
      screen.queryByRole("dialog", { name: "license upload" }),
    ).not.toBeInTheDocument();
  });
});
