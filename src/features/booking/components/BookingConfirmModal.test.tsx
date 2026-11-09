import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/shared/test/render";
import type { BookingDetails, Order } from "@/features/orders";
import BookingConfirmModal from "./BookingConfirmModal";

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ back: vi.fn() }),
}));

function booking(): BookingDetails {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 1);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);
  return {
    startDate,
    endDate,
    time: "09",
    days: 1,
    pricePerDay: 500,
    subtotal: 500,
    vat: 75,
    total: 575,
    notes: "",
  };
}

function draft(): Order {
  return {
    id: "226",
    orderNumber: "226",
    userId: "test-user",
    car: {
      id: "1",
      imageUrl: "https://example.com/creta.jpg",
      year: 2024,
      companyName: "T-Car",
      companyLogo: "https://example.com/company.svg",
      lowerPrice: 90,
      maxPrice: 120,
      rate: 4.5,
      note: null,
      brand: { id: "1", title: "Hyundai", logo: null },
      type: { id: "1", title: "Creta", logo: null },
      hasOffer: true,
      offer: null,
    },
    status: "coming",
    lateHours: null,
    bookingType: "daily",
    deliveryType: "to_location",
    pickupAt: "2026-11-10T09:00:00",
    returnAt: "2026-11-12T09:00:00",
    pickupLocation: {
      latitude: 24.7,
      longitude: 46.6,
      address: "Draft pickup address",
    },
    deliveryLocation: {
      latitude: 24.71,
      longitude: 46.61,
      address: "Draft return address",
    },
    branch: {
      id: "3",
      title: "Riyadh branch",
      distanceKm: 2.9,
      latitude: 24.7,
      longitude: 46.6,
      placeId: "draft-place",
      region: "Riyadh",
      address: "Branch address",
      logo: "https://example.com/company.svg",
    },
    note: "Draft booking note",
    carPrice: 45,
    price: 90,
    count: 2,
    deliveryFee: 0,
    serviceFee: 9,
    completionFee: 3,
    discount: 110,
    additionalServicesCost: 10,
    totalPrice: 112,
    taxValue: 11.2,
    finalPrice: 123.2,
    cancellationFee: 0,
    refundAmount: 0,
    taxRate: 10,
    taxRateType: "percent",
    serviceFeeRate: 10,
    serviceFeeRateType: "percent",
    payExtension: false,
    pendingExtensionId: null,
    hasModifyRequest: false,
    hasDriver: false,
    isRated: false,
    myRating: { companyRate: null, driverRate: null },
    createdAt: "2026-11-09 12:00:00",
    terms: "<p>Return the car on time from the draft.</p>",
  };
}

function renderModal() {
  const onContinue = vi.fn();
  const user = userEvent.setup();
  renderWithIntl(
    <BookingConfirmModal
      open
      onClose={vi.fn()}
      onBack={vi.fn()}
      onContinue={onContinue}
      carName="Creta"
      carBrand="Hyundai"
      carYear={2024}
      showroomLogo="https://example.com/office-1.webp"
      carImage="https://example.com/creta.jpg"
      showroom="Riyadh branch"
      rating={4.5}
      booking={booking()}
    />,
  );
  return { user, onContinue };
}

describe("BookingConfirmModal", () => {
  it("requires terms before continuing to payment", async () => {
    const { user, onContinue } = renderModal();
    await user.click(screen.getByRole("button", { name: "Booking & Payment" }));

    expect(
      await screen.findByText("Accept the terms and conditions to continue"),
    ).toBeInTheDocument();
    expect(onContinue).not.toHaveBeenCalled();
  });

  it("submits terms acceptance with the keyboard", async () => {
    const { user, onContinue } = renderModal();
    await user.click(
      screen.getByRole("checkbox", { name: /I agree to all requirements/ }),
    );
    await user.tab();
    await user.keyboard("{Enter}");

    expect(onContinue).toHaveBeenCalledOnce();
  });

  it("keeps the confirmation content scrollable inside the dialog body", () => {
    renderModal();

    const dialog = screen.getByRole("dialog");
    const form = dialog.querySelector("form");
    const body = form?.parentElement?.parentElement;
    const scrollArea = form?.firstElementChild;

    expect(body).toHaveClass("overflow-hidden");
    expect(form).toHaveClass("min-h-0");
    expect(scrollArea).toHaveClass("min-h-0", "overflow-y-auto");
  });

  it("renders API draft prices, locations, terms, and selected add-ons", () => {
    renderWithIntl(
      <BookingConfirmModal
        open
        onClose={vi.fn()}
        onBack={vi.fn()}
        onContinue={vi.fn()}
        carName="Creta"
        carBrand="Hyundai"
        carYear={2024}
        carImage="https://example.com/creta.jpg"
        showroom="Riyadh branch"
        rating={4.5}
        booking={booking()}
        draft={draft()}
        selectedAddons={[
          { id: "driver-1", title: "Additional driver", price: 10 },
        ]}
      />,
    );

    expect(screen.getByText("Draft pickup address")).toBeInTheDocument();
    expect(screen.getByText("Draft return address")).toBeInTheDocument();
    expect(
      screen.getByText("Return the car on time from the draft."),
    ).toBeInTheDocument();
    expect(screen.getByText("Additional driver")).toBeInTheDocument();
    expect(screen.getByText("2 × 45")).toBeInTheDocument();
    expect(screen.getByText("123.2")).toBeInTheDocument();
    expect(
      screen.queryByText("Return the car on time."),
    ).not.toBeInTheDocument();
  });
});
