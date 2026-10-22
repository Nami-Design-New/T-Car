import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
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
    await user.selectOptions(screen.getByRole("combobox"), "10:00 AM");
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
});
