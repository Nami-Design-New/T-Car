import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Order } from "@/features/orders";
import { renderWithIntl } from "@/shared/test/render";
import BookingDatesInfo from "./BookingDatesInfo";
import BookingDetailsHeader from "./BookingDetailsHeader";
import BookingDetailsScreen from "./BookingDetailsScreen";
import BookingSidebar from "./BookingSidebar";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

vi.mock("./BookingCountdown", () => ({
  default: () => <div data-testid="booking-countdown" />,
}));

const ORDER: Order = {
  id: "153",
  orderNumber: "ORD-6984BC6E",
  userId: "42",
  car: {
    id: "7",
    imageUrl: null,
    year: 2025,
    companyName: "Example company",
    companyLogo: null,
    lowerPrice: 90,
    maxPrice: 120,
    rate: 4.5,
    note: null,
    brand: { id: "1", title: "Toyota", logo: null },
    type: { id: "2", title: "Avalon", logo: null },
    hasOffer: false,
    offer: null,
  },
  status: "late",
  lateHours: 5,
  bookingType: "daily",
  deliveryType: "from_branch",
  pickupAt: "2099-11-10T09:30:00",
  returnAt: "2099-11-12T10:45:00",
  pickupLocation: { latitude: null, longitude: null, address: null },
  deliveryLocation: { latitude: null, longitude: null, address: null },
  branch: {
    id: "3",
    title: "Riyadh branch",
    distanceKm: null,
    latitude: 24.7136,
    longitude: 46.6753,
    placeId: "place-1",
    region: "Riyadh",
    address: "Branch address",
    logo: null,
  },
  note: "Please call first",
  carPrice: 45,
  price: 90,
  count: 2,
  deliveryFee: 10,
  serviceFee: 9,
  completionFee: 3,
  discount: 5,
  additionalServicesCost: 0,
  totalPrice: 112,
  taxValue: 11.2,
  finalPrice: 123.2,
  cancellationFee: 20,
  refundAmount: 103.2,
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
  createdAt: "2026-11-08 12:00:00",
  terms: "<p>Return on time.</p>",
};

describe("booking details UI", () => {
  it("renders the E7 price rows in the design order", () => {
    renderWithIntl(<BookingSidebar booking={ORDER} />);
    const sidebar = screen.getByRole("complementary");
    const labels = within(sidebar)
      .getAllByText(
        /^(Price|Delivery fee|Service fee|Tamm fee|Discount|Total before tax|Tax|Total)$/,
      )
      .map((node) => node.textContent);

    expect(labels).toEqual([
      "Price",
      "Delivery fee",
      "Service fee",
      "Tamm fee",
      "Discount",
      "Total before tax",
      "Tax",
      "Total",
    ]);
    expect(screen.getByText("2 × 45")).toBeInTheDocument();
    expect(screen.getByText("10%")).toBeInTheDocument();
    expect(screen.getByText("Return on time.")).toBeInTheDocument();
  });

  it("uses the branch title and address for both from-branch addresses", () => {
    renderWithIntl(<BookingDatesInfo booking={ORDER} />);
    expect(screen.getAllByText("Riyadh branch — Branch address")).toHaveLength(
      2,
    );
    expect(screen.getByText("Please call first")).toBeInTheDocument();
  });

  it("shows the action menu for a booking without createdAt like any other", () => {
    renderWithIntl(
      <BookingDetailsHeader
        booking={{ ...ORDER, status: "coming", createdAt: null }}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Booking actions" }),
    ).toBeInTheDocument();
    expect(screen.getByText(`#${ORDER.orderNumber}`)).toBeInTheDocument();
  });

  it("opens the actions dropdown with the actions the booking allows", async () => {
    // Radix locks pointer events on the page while the menu is open.
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderWithIntl(
      <BookingDetailsHeader booking={{ ...ORDER, status: "coming" }} />,
    );
    await user.click(screen.getByRole("button", { name: "Booking actions" }));
    const items = screen
      .getAllByRole("menuitem")
      .map((item) => item.textContent);
    // A future pickup on a coming booking: edit and cancel, no extension.
    expect(items).toHaveLength(2);
    expect(screen.queryByRole("menuitem", { name: /extend/i })).toBeNull();
  });

  it("shows the countdown card for a late booking only", () => {
    const { rerender } = renderWithIntl(
      <BookingDetailsScreen booking={{ ...ORDER, status: "late" }} />,
    );
    expect(screen.getByTestId("booking-countdown")).toBeInTheDocument();

    for (const status of ["current", "coming", "complete"] as const) {
      rerender(<BookingDetailsScreen booking={{ ...ORDER, status }} />);
      expect(screen.queryByTestId("booking-countdown")).not.toBeInTheDocument();
    }
  });

  it("shows the two notices for coming and current bookings only", () => {
    const safety = /Please extend through the app only/;
    const { rerender } = renderWithIntl(
      <BookingDetailsScreen booking={{ ...ORDER, status: "coming" }} />,
    );
    expect(screen.getAllByRole("note")).toHaveLength(2);
    expect(screen.getByText(safety)).toBeInTheDocument();

    rerender(<BookingDetailsScreen booking={{ ...ORDER, status: "current" }} />);
    expect(screen.getAllByRole("note")).toHaveLength(2);

    for (const status of ["late", "complete", "cancelled"] as const) {
      rerender(<BookingDetailsScreen booking={{ ...ORDER, status }} />);
      expect(screen.queryByText(safety)).not.toBeInTheDocument();
    }
  });

  it("formats the API order time as returned, only with a createdAt", () => {
    const { rerender } = renderWithIntl(
      <BookingDetailsScreen
        booking={{ ...ORDER, createdAt: "2026-11-29 20:00:00" }}
      />,
    );
    expect(screen.getByText("Order time")).toBeInTheDocument();
    expect(screen.getByText(/November 29, 2026/)).toHaveTextContent(/8:00\sPM/);

    rerender(<BookingDetailsScreen booking={{ ...ORDER, createdAt: null }} />);
    expect(screen.queryByText("Order time")).not.toBeInTheDocument();
  });

  it("treats a running booking without createdAt like any other current booking", () => {
    renderWithIntl(
      <BookingDetailsScreen
        booking={{ ...ORDER, status: "current", createdAt: null }}
      />,
    );

    // A current booking offers the extension; the countdown stays late only.
    expect(
      screen.getByRole("button", { name: "Booking actions" }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("booking-countdown")).not.toBeInTheDocument();
  });

  it("adds fee and refund rows only for a cancelled booking", () => {
    const { rerender } = renderWithIntl(<BookingSidebar booking={ORDER} />);
    expect(screen.queryByText("Cancellation fee")).not.toBeInTheDocument();
    expect(screen.queryByText("Refund amount")).not.toBeInTheDocument();

    rerender(<BookingSidebar booking={{ ...ORDER, status: "cancelled" }} />);
    expect(screen.getByText("Cancellation fee")).toBeInTheDocument();
    expect(screen.getByText("Refund amount")).toBeInTheDocument();
  });
});
