import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/shared/test/render";
import ExtendDurationModal from "./ExtendDurationModal";

describe("ExtendDurationModal", () => {
  it("submits the selected number of days through the form", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    renderWithIntl(
      <ExtendDurationModal
        open
        onClose={vi.fn()}
        onConfirm={onConfirm}
        currentDays={5}
        pricePerDay={500}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Increase days" }));
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(onConfirm).toHaveBeenCalledWith(6);
  });
});
