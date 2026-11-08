import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ModelYearBadge } from "./ModelYearBadge";

describe("ModelYearBadge", () => {
  it("renders the model year with the shared badge styling", () => {
    render(<ModelYearBadge year={2026} />);

    expect(screen.getByText("2026")).toHaveClass(
      "bg-primary-100",
      "text-action-primary",
    );
  });
});
