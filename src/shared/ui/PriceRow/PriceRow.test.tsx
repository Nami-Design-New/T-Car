import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/shared/test/render";
import { PriceRow } from "./PriceRow";

describe("PriceRow", () => {
  it("renders the label, hint, and formatted SAR amount", () => {
    renderWithIntl(
      <PriceRow label="Daily price" hint="5 × 100" amount={500} />,
    );

    expect(screen.getByText("Daily price")).toBeInTheDocument();
    expect(screen.getByText("5 × 100")).toBeInTheDocument();
    expect(screen.getByText("500")).toBeInTheDocument();
  });

  it("emphasizes the total", () => {
    renderWithIntl(<PriceRow label="Total" amount={750} total />);

    expect(screen.getByText("750").parentElement).toHaveClass(
      "text-action-primary",
      "text-2xl",
    );
  });
});
