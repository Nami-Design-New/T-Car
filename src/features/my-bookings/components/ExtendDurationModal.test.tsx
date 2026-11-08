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
    expect(screen.getByText("500 SAR")).toBeInTheDocument();
    expect(screen.queryByText("VAT")).not.toBeInTheDocument();
    expect(screen.queryByText("Late fee")).not.toBeInTheDocument();
    expect(screen.queryByText("Total")).not.toBeInTheDocument();
  });
});
