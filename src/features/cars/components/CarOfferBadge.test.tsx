import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/shared/test/render";
import CarOfferBadge from "./CarOfferBadge";

describe("CarOfferBadge", () => {
  it("renders the compact ribbon variant for a detail image", () => {
    renderWithIntl(
      <CarOfferBadge
        offer={{ requiredDays: 5, freeDays: 1 }}
        variant="ribbon"
      />,
    );

    expect(screen.getByText("Special offer")).toHaveClass(
      "absolute",
      "top-4.5",
      "-left-9",
      "-rotate-45",
    );
  });
});
