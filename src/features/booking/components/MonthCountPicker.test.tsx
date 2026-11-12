import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/shared/test/render";
import MonthCountPicker from "./MonthCountPicker";

const startDate = new Date(2026, 10, 15);
const endDate = new Date(2026, 11, 15);

function renderPicker(value: number, onChange = vi.fn()) {
  renderWithIntl(
    <MonthCountPicker
      value={value}
      onChange={onChange}
      startDate={startDate}
      endDate={endDate}
    />,
  );
  return onChange;
}

describe("MonthCountPicker", () => {
  it("steps the month count with the plus and minus buttons", async () => {
    const onChange = renderPicker(3);
    const increase = screen.getByRole("button", { name: "Add a month" });
    const decrease = screen.getByRole("button", { name: "Remove a month" });

    await userEvent.click(increase);
    expect(onChange).toHaveBeenLastCalledWith(4);
    await userEvent.click(decrease);
    expect(onChange).toHaveBeenLastCalledWith(2);
  });

  it("disables the buttons at 1 and 12 months", () => {
    renderPicker(1);
    expect(
      screen.getByRole("button", { name: "Remove a month" }),
    ).toBeDisabled();
  });

  it("keeps the slider within 1 to 12 months", () => {
    const onChange = renderPicker(12);
    expect(screen.getByRole("button", { name: "Add a month" })).toBeDisabled();

    fireEvent.change(screen.getByRole("slider"), { target: { value: "5" } });
    expect(onChange).toHaveBeenLastCalledWith(5);
  });

  it("shows the resulting period", () => {
    renderPicker(1);
    expect(screen.getByText(/15 .* 2026/)).toBeInTheDocument();
  });
});
