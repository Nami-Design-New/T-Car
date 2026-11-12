import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NumberStepper } from "./NumberStepper";

describe("NumberStepper", () => {
  it("increments and enforces its minimum", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <NumberStepper
        value={1}
        onChange={onChange}
        decreaseLabel="Less"
        increaseLabel="More"
      />,
    );
    expect(screen.getByRole("button", { name: "Less" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "More" }));
    expect(onChange).toHaveBeenCalledWith(2);
  });
});
