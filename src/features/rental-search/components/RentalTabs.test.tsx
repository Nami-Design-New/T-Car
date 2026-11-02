import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RentalTabs from "./RentalTabs";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));

describe("RentalTabs", () => {
  it("hides options disabled by app settings", () => {
    render(
      <RentalTabs
        onSelect={vi.fn()}
        availability={{
          daily: true,
          monthly: false,
          station: true,
          airport: false,
          international: true,
        }}
      />,
    );

    expect(screen.getByText("rentalTabs.daily")).toBeInTheDocument();
    expect(screen.getByText("rentalTabs.station")).toBeInTheDocument();
    expect(screen.getByText("rentalTabs.international")).toBeInTheDocument();
    expect(screen.queryByText("rentalTabs.monthly")).not.toBeInTheDocument();
    expect(screen.queryByText("rentalTabs.airport")).not.toBeInTheDocument();
  });
});
