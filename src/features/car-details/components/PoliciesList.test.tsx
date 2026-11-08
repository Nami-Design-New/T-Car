import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import PoliciesList from "./PoliciesList";
import { renderWithIntl } from "@/shared/test/render";

const POLICIES = {
  clientInstructions: [
    "<ol><li>Report incidents immediately.</li><li>Return on time.</li></ol>",
  ],
  cancellationPolicies: ["<p>Cancellation fees may apply.</p>"],
};

describe("PoliciesList", () => {
  it("shows renter instructions first and switches to cancellation policy", async () => {
    renderWithIntl(<PoliciesList policies={POLICIES} />);

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

  it("renders the policy HTML as markup", () => {
    renderWithIntl(<PoliciesList policies={POLICIES} />);

    const list = screen.getByRole("list");
    expect(list.tagName).toBe("OL");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("uses white tab surfaces", () => {
    renderWithIntl(<PoliciesList policies={POLICIES} />);

    expect(
      screen.getByRole("tab", { name: "Renter instructions" }),
    ).toHaveClass("bg-white");
    expect(
      screen.getByRole("tab", { name: "Cancellation policy" }),
    ).toHaveClass("bg-white");
  });
});
