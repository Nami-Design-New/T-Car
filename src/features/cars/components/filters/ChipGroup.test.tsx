import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/shared/test/render";
import ChipGroup from "./ChipGroup";

const items = Array.from({ length: 5 }, (_, index) => ({
  id: `t${index}`,
  title: `Type ${index}`,
}));

describe("ChipGroup", () => {
  it("keeps a selected chip visible while collapsed", () => {
    renderWithIntl(
      <ChipGroup
        title="Car type"
        items={items}
        selected={["t4"]}
        onToggle={vi.fn()}
        onClear={vi.fn()}
        visibleCount={2}
      />,
    );

    expect(
      screen.getAllByText(/^Type \d$/).map((node) => node.textContent),
    ).toEqual(["Type 0", "Type 1", "Type 4"]);
    expect(screen.getByRole("button", { name: "+2 more" })).toBeTruthy();
  });

  it("toggles a chip and shows no expander when everything fits", () => {
    const onToggle = vi.fn();
    renderWithIntl(
      <ChipGroup
        title="Car type"
        items={items.slice(0, 2)}
        selected={[]}
        onToggle={onToggle}
        onClear={vi.fn()}
        visibleCount={2}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Type 1" }));
    expect(onToggle).toHaveBeenCalledWith("t1");
    expect(screen.queryByRole("button", { name: /more|Show less/ })).toBeNull();
  });
});
