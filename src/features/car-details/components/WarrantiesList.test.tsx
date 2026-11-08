import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import WarrantiesList from "./WarrantiesList";
import { renderWithIntl } from "@/shared/test/render";

const WARRANTIES = [
  {
    id: "1",
    title: "On-time arrival",
    content: "<p>20% off the first day if <strong>late</strong>.</p>",
  },
  {
    id: "2",
    title: "Clean car",
    content: "<p>20% off the first day if not clean.</p>",
  },
];

describe("WarrantiesList", () => {
  it("shows an empty state when the car has no warranties", () => {
    renderWithIntl(<WarrantiesList warranties={[]} />);

    expect(screen.getByText("No warranties available")).toBeInTheDocument();
  });

  it("starts closed and opens one warranty at a time", async () => {
    renderWithIntl(<WarrantiesList warranties={WARRANTIES} />);
    const onTime = screen.getByRole("button", { name: "On-time arrival" });
    const clean = screen.getByRole("button", { name: "Clean car" });
    expect(onTime).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("late")).not.toBeInTheDocument();

    await userEvent.click(onTime);
    expect(onTime).toHaveAttribute("aria-expanded", "true");
    // The warranty HTML is rendered as markup, not as escaped text.
    expect(screen.getByText("late").tagName).toBe("STRONG");

    await userEvent.click(clean);
    expect(clean).toHaveAttribute("aria-expanded", "true");
    expect(onTime).toHaveAttribute("aria-expanded", "false");
  });
});
