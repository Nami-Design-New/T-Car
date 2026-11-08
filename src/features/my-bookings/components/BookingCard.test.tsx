import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/shared/test/render";
import type { OrderListItem, OrderStatus } from "@/features/orders";
import BookingCard from "./BookingCard";
import BookingStatusBadge from "./BookingStatusBadge";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const ORDER: OrderListItem = {
  id: "153",
  carName: "Toyota Avalon",
  carImage: null,
  carYear: 2025,
  companyName: "Example company",
  companyLogo: null,
  companyRate: 3.8,
  date: "2026-11-10 09:30",
  status: "late",
  lateHours: 5,
  isRated: false,
  myRating: { companyRate: null, driverRate: null },
};

describe("BookingCard", () => {
  it("shows the E6 list fields, localized date, status, and late hours", () => {
    renderWithIntl(<BookingCard booking={ORDER} />);
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/account/bookings/153",
    );
    expect(screen.getByText("Toyota Avalon")).toBeInTheDocument();
    expect(screen.getByText("2025")).toBeInTheDocument();
    expect(screen.getByText("Example company")).toBeInTheDocument();
    expect(screen.getByText("3.8")).toBeInTheDocument();
    expect(screen.getByText(/Nov 10, 2026/)).toBeInTheDocument();
    expect(screen.getByText("Late")).toBeInTheDocument();
    expect(screen.getByText("Late by 5 hours")).toBeInTheDocument();
  });
});

describe("BookingStatusBadge", () => {
  const LABELS: Record<OrderStatus, string> = {
    start: "Draft",
    new: "New",
    accepted: "Accepted",
    rejected: "Rejected",
    open: "Open",
    coming: "Upcoming",
    current: "Current",
    late: "Late",
    complete: "Completed",
    cancelled: "Cancelled",
    suspended: "Suspended",
  };

  it.each(Object.entries(LABELS) as [OrderStatus, string][])(
    "renders the %s status as %s",
    (status, label) => {
      renderWithIntl(
        <BookingStatusBadge status={status} dateTime="Nov 10" lateHours={2} />,
      );
      expect(screen.getByText(label)).toBeInTheDocument();
      expect(screen.getByText("Nov 10")).toBeInTheDocument();
      // Late hours belong to a late booking only.
      if (status === "late") {
        expect(screen.getByText("Late by 2 hours")).toBeInTheDocument();
      } else {
        expect(screen.queryByText(/Late by/)).not.toBeInTheDocument();
      }
    },
  );

  it("uses the singular for one late hour", () => {
    renderWithIntl(
      <BookingStatusBadge status="late" dateTime="Nov 10" lateHours={1} />,
    );
    expect(screen.getByText("Late by 1 hour")).toBeInTheDocument();
  });
});
