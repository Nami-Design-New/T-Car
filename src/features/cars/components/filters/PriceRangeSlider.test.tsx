import { screen } from "@testing-library/react";
import { renderWithIntl } from "@/shared/test/render";
import { describe, expect, it, vi } from "vitest";
import PriceRangeSlider from "./PriceRangeSlider";

describe("PriceRangeSlider", () => {
  it("shows the current range with SAR marks", () => {
    renderWithIntl(
      <PriceRangeSlider
        min={5}
        max={55}
        minValue={10}
        maxValue={50}
        onMinChange={vi.fn()}
        onMaxChange={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    expect(screen.getAllByRole("img", { name: "SAR" })).toHaveLength(2);
    expect(screen.queryByText("$")).not.toBeInTheDocument();
  });
});
