import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/shared/test/render";
import BookingCountdown from "./BookingCountdown";

describe("BookingCountdown", () => {
  afterEach(() => vi.useRealTimers());

  it("counts the time elapsed since the return time as returned by the API", () => {
    vi.useFakeTimers();
    // The API time is passed straight to Date with no timezone normalization.
    vi.setSystemTime(new Date("2026-11-07T20:07:00Z"));
    renderWithIntl(
      <BookingCountdown targetDateTime="2026-11-03T18:00:00" mode="late" />,
    );

    expect(
      screen.getByRole("heading", { name: "Late for return" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Late for return by:")).toBeInTheDocument();
    // Days are not padded; hours and minutes are two digits.
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("04")).toBeInTheDocument();
    expect(screen.getByText("07")).toBeInTheDocument();
    expect(
      screen.getByText(
        "The late fee keeps accruing until the booking is extended or the car is returned.",
      ),
    ).toBeInTheDocument();
  });

  it("counts down to the return time for a current booking", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-03T16:07:00"));
    renderWithIntl(
      <BookingCountdown
        targetDateTime="2026-11-03T18:00:00"
        mode="remaining"
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Time remaining" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Until return time:")).toBeInTheDocument();
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("53")).toBeInTheDocument();
    expect(
      screen.queryByText(/late fee keeps accruing/i),
    ).not.toBeInTheDocument();
  });
});
