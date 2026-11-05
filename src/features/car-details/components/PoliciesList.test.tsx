import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import PoliciesList from "./PoliciesList";
import { renderWithIntl } from "@/shared/test/render";

describe("PoliciesList", () => {
  it("shows renter instructions first and switches to cancellation policy", async () => {
    renderWithIntl(
      <PoliciesList
        policies={{
          clientInstructions: ["Report incidents immediately."],
          cancellationPolicies: ["Cancellation fees may apply."],
        }}
      />,
    );

    expect(
      screen.getByText("Report incidents immediately."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Cancellation fees may apply."),
    ).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("tab", { name: "Cancellation policy" }),
    );
    expect(
      screen.getByText("Cancellation fees may apply."),
    ).toBeInTheDocument();
  });

  it("uses logical layout classes and white tab surfaces", () => {
    renderWithIntl(
      <PoliciesList
        policies={{
          clientInstructions: ["Report incidents immediately."],
          cancellationPolicies: ["Cancellation fees may apply."],
        }}
      />,
    );

    expect(screen.getByRole("tablist")).toHaveClass("justify-end");
    expect(screen.getByRole("list")).toHaveClass("ps-5", "text-start");
    expect(
      screen.getByRole("tab", { name: "Renter instructions" }),
    ).toHaveClass("bg-white");
    expect(
      screen.getByRole("tab", { name: "Cancellation policy" }),
    ).toHaveClass("bg-white");
  });
});
