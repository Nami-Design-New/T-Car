import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/shared/test/render";
import BookingCountdown from "./BookingCountdown";

describe("BookingCountdown", () => {
  afterEach(() => vi.useRealTimers());

  it("counts the time elapsed since the return time (Riyadh time)", () => {
    vi.useFakeTimers();
    // Return 2026-11-03 18:00 Riyadh = 15:00 UTC; now is 4 d 5 h 7 min later.
    vi.setSystemTime(new Date("2026-11-07T20:07:00Z"));
    renderWithIntl(<BookingCountdown targetDateTime="2026-11-03T18:00:00" />);

    expect(
      screen.getByRole("heading", { name: "Late for return" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Late for return by:")).toBeInTheDocument();
    // Days are not padded; hours and minutes are two digits.
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("05")).toBeInTheDocument();
    expect(screen.getByText("07")).toBeInTheDocument();
    expect(
      screen.getByText(
        "The late fee keeps accruing until the booking is extended or the car is returned.",
      ),
    ).toBeInTheDocument();
  });
});
