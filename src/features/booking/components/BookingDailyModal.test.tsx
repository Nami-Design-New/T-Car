import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { BookingDetails } from "@/features/orders";
import { renderWithIntl } from "@/shared/test/render";
import BookingDailyModal from "./BookingDailyModal";

function futureDateButtons() {
  return screen
    .getAllByRole("button")
    .filter(
      (button) =>
        /^\d+$/.test(button.textContent?.trim() ?? "") &&
        !button.hasAttribute("disabled"),
    );
}

describe("BookingDailyModal", () => {
  it("submits normalized daily booking details with the keyboard", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    renderWithIntl(
      <BookingDailyModal
        open
        onClose={vi.fn()}
        pricePerDay={500}
        onConfirm={onConfirm}
      />,
    );

    const dates = futureDateButtons();
    await user.click(dates[0]);
    await user.click(dates[1]);
    await user.click(screen.getByRole("button", { name: /10:00 AM/ }));
    await user.type(
      screen.getByPlaceholderText("Write any notes or special requests..."),
      " Need help ",
    );
    await user.tab();
    await user.keyboard("{Enter}");

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onConfirm.mock.calls[0][0]).toMatchObject({
      time: "10:00 AM",
      notes: "Need help",
      days: 1,
      pricePerDay: 500,
      total: 575,
    });
  });

  it("keeps live order amounts and hides a speculative total in edit mode", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const initialDetails: BookingDetails = {
      startDate: new Date("2099-01-10T09:00:00"),
      endDate: new Date("2099-01-12T09:00:00"),
      time: "9:00 AM",
      days: 2,
      pricePerDay: 45,
      subtotal: 90,
      vat: 11.2,
      total: 123.2,
      notes: "",
      pickupAddress: "Branch",
      dropoffAddress: "Branch",
      pickupLocation: null,
      dropoffLocation: null,
    };

    renderWithIntl(
      <BookingDailyModal
        open
        mode="edit"
        onClose={vi.fn()}
        pricePerDay={45}
        initialDetails={initialDetails}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.queryByText("Total")).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Send change request" }),
    );

    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ subtotal: 90, vat: 11.2, total: 123.2 }),
    );
  });
});
